"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyV2Service = exports.StrategyV2Service = exports.DEFAULT_STRATEGY_V2_PARAMS = void 0;
const indicator_service_1 = require("../indicator.service");
const crypto_1 = __importDefault(require("crypto"));
exports.DEFAULT_STRATEGY_V2_PARAMS = {
    emaFast: 9,
    emaSlow: 21,
    emaTrend: 50,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    bbPeriod: 20,
    bbDeviation: 2.0,
    minSignalScore: 80,
    cooldownSeconds: 30,
    minPriceMovement: 0.0002,
    minConfirmations: 3
};
const STRATEGY_V2_DISCLAIMER = 'Strategy V2 confidence and normalized quality scores (0-100) are algorithmically computed for research in DEMO/PAPER mode. Score does not represent probability of profit. No signal guarantees winning trades.';
class StrategyV2Service {
    /**
     * 1. MARKET REGIME DETECTION
     * Strict look-ahead bias prevention: uses historical candles up to index currentIndex.
     */
    classifyRegime(candles, currentIndex = candles.length - 1) {
        if (!candles || candles.length === 0 || currentIndex < 0 || currentIndex >= candles.length) {
            return 'UNKNOWN';
        }
        const slice = candles.slice(0, currentIndex + 1);
        if (slice.length < 20) {
            return 'UNKNOWN';
        }
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(slice);
        const currentAtr = indicators.atr14;
        // Rolling ATR lookback
        const atrHistory = [];
        const lookback = Math.min(40, slice.length - 15);
        for (let j = 0; j < lookback; j++) {
            const idx = slice.length - 1 - j;
            if (idx >= 15) {
                const subSlice = slice.slice(0, idx + 1);
                const subInd = indicator_service_1.indicatorService.calculateAllIndicators(subSlice);
                atrHistory.push(subInd.atr14);
            }
        }
        const atrAvg = atrHistory.length > 0
            ? atrHistory.reduce((s, v) => s + v, 0) / atrHistory.length
            : currentAtr;
        const bb = indicators.bollinger;
        const bollingerWidth = bb.middle > 0 ? (bb.upper - bb.lower) / bb.middle : 0;
        // EMA slope over last 5 bars
        let emaSlope = 0;
        if (slice.length >= 26) {
            const prevSliceCloses = slice.slice(0, slice.length - 5).map(c => c.close);
            const prevEmaArr = indicator_service_1.indicatorService.calculateEMA(prevSliceCloses, 21);
            const prevEma = prevEmaArr.length > 0 ? prevEmaArr[prevEmaArr.length - 1] : indicators.ema21;
            emaSlope = indicators.ema21 - prevEma;
        }
        const currentPrice = slice[slice.length - 1].close;
        // 1. High Volatility Check
        if (atrAvg > 0 && currentAtr > 1.45 * atrAvg) {
            return 'HIGH_VOLATILITY';
        }
        // 2. Low Volatility Check
        if (atrAvg > 0 && currentAtr < 0.65 * atrAvg && bollingerWidth < 0.008) {
            return 'LOW_VOLATILITY';
        }
        // 3. Trend vs Range
        const emaVsSma50Diff = Math.abs(indicators.ema21 - indicators.sma50);
        const trendStrengthPct = indicators.sma50 > 0 ? (emaVsSma50Diff / indicators.sma50) * 100 : 0;
        const significantSlope = Math.abs(emaSlope) > (currentPrice * 0.0008);
        if (trendStrengthPct > 0.30 || significantSlope) {
            if (indicators.ema21 > indicators.sma50 && emaSlope >= 0) {
                return 'TRENDING_UP';
            }
            else if (indicators.ema21 < indicators.sma50 && emaSlope <= 0) {
                return 'TRENDING_DOWN';
            }
        }
        // Default to Ranging if moving averages are flat or Bollinger bands are compact
        return 'RANGING';
    }
    /**
     * 2. SIGNAL QUALITY SCORING ENGINE (0-100 Points)
     */
    computeSignalScore(direction, price, candles, indicators, regime, params = exports.DEFAULT_STRATEGY_V2_PARAMS) {
        let emaScore = 0; // max 25
        let rsiScore = 0; // max 20
        let macdScore = 0; // max 20
        let bollingerScore = 0; // max 15
        let momentumScore = 0; // max 10
        let volatilityScore = 0; // max 10
        const contributingIndicators = [];
        const reasons = [];
        let confirmationsCount = 0;
        const { ema21, sma50, rsi14, macd, bollinger, atr14 } = indicators;
        // ==========================================
        // 1. EMA Trend Confirmation (Max 25 pts)
        // ==========================================
        if (direction === 'BUY') {
            if (price > ema21) {
                emaScore += 15;
                if (ema21 > sma50) {
                    emaScore += 10;
                    contributingIndicators.push('EMA_ALIGNMENT_BULLISH');
                    reasons.push(`Price (${price.toFixed(4)}) > EMA21 (${ema21.toFixed(4)}) and EMA21 > SMA50 (${sma50.toFixed(4)})`);
                }
                else {
                    reasons.push(`Price (${price.toFixed(4)}) > EMA21 (${ema21.toFixed(4)}) [EMA/SMA50 lag]`);
                }
            }
            else if (regime === 'RANGING' && (ema21 - price) / ema21 < 0.002) {
                emaScore += 8;
                reasons.push('Price consolidating near EMA21 base in ranging structure');
            }
        }
        else {
            // SELL
            if (price < ema21) {
                emaScore += 15;
                if (ema21 < sma50) {
                    emaScore += 10;
                    contributingIndicators.push('EMA_ALIGNMENT_BEARISH');
                    reasons.push(`Price (${price.toFixed(4)}) < EMA21 (${ema21.toFixed(4)}) and EMA21 < SMA50 (${sma50.toFixed(4)})`);
                }
                else {
                    reasons.push(`Price (${price.toFixed(4)}) < EMA21 (${ema21.toFixed(4)}) [EMA/SMA50 lag]`);
                }
            }
            else if (regime === 'RANGING' && (price - ema21) / ema21 < 0.002) {
                emaScore += 8;
                reasons.push('Price consolidating near EMA21 ceiling in ranging structure');
            }
        }
        if (emaScore >= 15)
            confirmationsCount++;
        // ==========================================
        // 2. RSI Confirmation (Max 20 pts)
        // ==========================================
        if (direction === 'BUY') {
            if (regime === 'RANGING' && rsi14 <= Number(params.rsiOversold || 30)) {
                // Mean reversion bounce
                rsiScore = 20;
                contributingIndicators.push('RSI_OVERSOLD_REBOUND');
                reasons.push(`RSI (${rsi14.toFixed(1)}) oversold (<= ${params.rsiOversold}) in RANGING market; high-conviction bounce`);
            }
            else if (rsi14 >= 48 && rsi14 <= Number(params.rsiOverbought || 70)) {
                // Healthy bullish momentum
                rsiScore = rsi14 >= 52 ? 20 : 12;
                contributingIndicators.push('RSI_BULLISH_MOMENTUM');
                reasons.push(`RSI (${rsi14.toFixed(1)}) confirms upward momentum in prime acceleration zone (48-${params.rsiOverbought})`);
            }
            else if (rsi14 > Number(params.rsiOverbought || 70)) {
                rsiScore = 0;
                reasons.push(`RSI (${rsi14.toFixed(1)}) is overbought; penalizing BUY score to prevent top-ticking`);
            }
        }
        else {
            // SELL
            if (regime === 'RANGING' && rsi14 >= Number(params.rsiOverbought || 70)) {
                // Mean reversion fade
                rsiScore = 20;
                contributingIndicators.push('RSI_OVERBOUGHT_FADE');
                reasons.push(`RSI (${rsi14.toFixed(1)}) overbought (>= ${params.rsiOverbought}) in RANGING market; high-conviction fade`);
            }
            else if (rsi14 <= 52 && rsi14 >= Number(params.rsiOversold || 30)) {
                // Healthy bearish momentum
                rsiScore = rsi14 <= 48 ? 20 : 12;
                contributingIndicators.push('RSI_BEARISH_MOMENTUM');
                reasons.push(`RSI (${rsi14.toFixed(1)}) confirms downward momentum in prime decay zone (${params.rsiOversold}-52)`);
            }
            else if (rsi14 < Number(params.rsiOversold || 30)) {
                rsiScore = 0;
                reasons.push(`RSI (${rsi14.toFixed(1)}) is oversold; penalizing SELL score to prevent bottom-ticking`);
            }
        }
        if (rsiScore >= 12)
            confirmationsCount++;
        // ==========================================
        // 3. MACD Confirmation (Max 20 pts)
        // ==========================================
        if (direction === 'BUY') {
            if (macd.value > macd.signal) {
                macdScore += 10;
                if (macd.histogram > 0) {
                    macdScore += 10;
                    contributingIndicators.push('MACD_BULLISH_CROSS_EXPANDING');
                    reasons.push(`MACD (${macd.value.toFixed(4)}) > Signal (${macd.signal.toFixed(4)}) with positive histogram (+${macd.histogram.toFixed(4)})`);
                }
                else {
                    reasons.push(`MACD above signal line but histogram contracting`);
                }
            }
        }
        else {
            // SELL
            if (macd.value < macd.signal) {
                macdScore += 10;
                if (macd.histogram < 0) {
                    macdScore += 10;
                    contributingIndicators.push('MACD_BEARISH_CROSS_EXPANDING');
                    reasons.push(`MACD (${macd.value.toFixed(4)}) < Signal (${macd.signal.toFixed(4)}) with negative histogram (${macd.histogram.toFixed(4)})`);
                }
                else {
                    reasons.push(`MACD below signal line but histogram recovering`);
                }
            }
        }
        if (macdScore >= 10)
            confirmationsCount++;
        // ==========================================
        // 4. Bollinger Bands Confirmation (Max 15 pts)
        // ==========================================
        const channelWidth = bollinger.upper - bollinger.lower || 1;
        const posInChannel = (price - bollinger.lower) / channelWidth; // 0 = lower band, 1 = upper band
        if (direction === 'BUY') {
            if (regime === 'RANGING') {
                if (posInChannel <= 0.25 || price <= bollinger.lower) {
                    bollingerScore = 15;
                    contributingIndicators.push('BOLLINGER_LOWER_REBOUND');
                    reasons.push(`Price tested lower Bollinger Band (${bollinger.lower.toFixed(4)}); mean-reversion target SMA (${bollinger.middle.toFixed(4)})`);
                }
                else if (posInChannel <= 0.45) {
                    bollingerScore = 10;
                    reasons.push('Price in lower-mid channel with upside room to SMA20');
                }
            }
            else if (regime === 'TRENDING_UP') {
                if (posInChannel >= 0.45 && posInChannel <= 0.85) {
                    bollingerScore = 15;
                    contributingIndicators.push('BOLLINGER_TREND_BAND_RIDE');
                    reasons.push('Price riding upper-middle Bollinger expansion band in established uptrend');
                }
                else if (posInChannel > 0.85) {
                    bollingerScore = 5;
                    reasons.push('Price pressing extreme upper Bollinger band; elevated extension risk');
                }
            }
            else {
                bollingerScore = 5;
            }
        }
        else {
            // SELL
            if (regime === 'RANGING') {
                if (posInChannel >= 0.75 || price >= bollinger.upper) {
                    bollingerScore = 15;
                    contributingIndicators.push('BOLLINGER_UPPER_FADE');
                    reasons.push(`Price tested upper Bollinger Band (${bollinger.upper.toFixed(4)}); mean-reversion target SMA (${bollinger.middle.toFixed(4)})`);
                }
                else if (posInChannel >= 0.55) {
                    bollingerScore = 10;
                    reasons.push('Price in upper-mid channel with downside room to SMA20');
                }
            }
            else if (regime === 'TRENDING_DOWN') {
                if (posInChannel <= 0.55 && posInChannel >= 0.15) {
                    bollingerScore = 15;
                    contributingIndicators.push('BOLLINGER_TREND_BAND_DECAY');
                    reasons.push('Price riding lower-middle Bollinger decay band in established downtrend');
                }
                else if (posInChannel < 0.15) {
                    bollingerScore = 5;
                    reasons.push('Price pressing extreme lower Bollinger band; elevated extension risk');
                }
            }
            else {
                bollingerScore = 5;
            }
        }
        if (bollingerScore >= 10)
            confirmationsCount++;
        // ==========================================
        // 5. Momentum Confirmation (Max 10 pts)
        // ==========================================
        if (candles.length >= 3) {
            const c1 = candles[candles.length - 3];
            const c2 = candles[candles.length - 2];
            const c3 = candles[candles.length - 1];
            if (direction === 'BUY') {
                if (c3.close > c2.close && c2.close >= c1.close) {
                    momentumScore = 10;
                    contributingIndicators.push('3_BAR_HIGHER_CLOSES');
                    reasons.push('Consecutive higher closes confirm micro-price acceleration');
                }
                else if (c3.close > c3.open) {
                    momentumScore = 6;
                    reasons.push('Current bar closed green');
                }
            }
            else {
                // SELL
                if (c3.close < c2.close && c2.close <= c1.close) {
                    momentumScore = 10;
                    contributingIndicators.push('3_BAR_LOWER_CLOSES');
                    reasons.push('Consecutive lower closes confirm micro-price deceleration');
                }
                else if (c3.close < c3.open) {
                    momentumScore = 6;
                    reasons.push('Current bar closed red');
                }
            }
        }
        if (momentumScore >= 6)
            confirmationsCount++;
        // ==========================================
        // 6. Volatility & Data Quality Confirmation (Max 10 pts)
        // ==========================================
        if (regime === 'HIGH_VOLATILITY') {
            volatilityScore = 5;
            reasons.push('High volatility regime: applying 50% volatility risk penalty');
        }
        else if (regime === 'UNKNOWN') {
            volatilityScore = 0;
            reasons.push('Market regime unknown; zero volatility quality credit');
        }
        else {
            volatilityScore = 10;
            contributingIndicators.push('STABLE_VOLATILITY_DATA');
            reasons.push('ATR & candle spreads within verified healthy bounds');
        }
        if (volatilityScore >= 8)
            confirmationsCount++;
        const totalScore = emaScore + rsiScore + macdScore + bollingerScore + momentumScore + volatilityScore;
        let scoreBucket;
        if (totalScore >= 80) {
            scoreBucket = '80-100 (HIGH_QUALITY)';
        }
        else if (totalScore >= 70) {
            scoreBucket = '70-79 (CANDIDATE)';
        }
        else if (totalScore >= 60) {
            scoreBucket = '60-69 (WEAK)';
        }
        else {
            scoreBucket = '0-59 (WAIT)';
        }
        return {
            emaScore,
            rsiScore,
            macdScore,
            bollingerScore,
            momentumScore,
            volatilityScore,
            totalScore,
            scoreBucket,
            confirmationsCount,
            contributingIndicators,
            reasons
        };
    }
    /**
     * 3. REGIME-SPECIFIC STRATEGY EVALUATION
     */
    evaluateSignal(candles, indicators, customParams) {
        const params = { ...exports.DEFAULT_STRATEGY_V2_PARAMS, ...customParams };
        if (!candles || candles.length === 0) {
            const defaultInd = indicator_service_1.indicatorService.calculateAllIndicators([]);
            const emptyScore = {
                emaScore: 0,
                rsiScore: 0,
                macdScore: 0,
                bollingerScore: 0,
                momentumScore: 0,
                volatilityScore: 0,
                totalScore: 0,
                scoreBucket: '0-59 (WAIT)',
                confirmationsCount: 0,
                contributingIndicators: [],
                reasons: ['No market candle data available']
            };
            return {
                signal: 'WAIT',
                score: 0,
                regime: 'UNKNOWN',
                scoreBreakdown: emptyScore,
                fingerprint: 'NONE',
                isCandidate: false,
                isValidHighQuality: false,
                reasons: ['No candle data available'],
                indicators: defaultInd,
                disclaimer: STRATEGY_V2_DISCLAIMER,
                parametersUsed: params,
                timestamp: Date.now()
            };
        }
        const currentCandle = candles[candles.length - 1];
        const price = currentCandle.close;
        const computedInd = indicators || indicator_service_1.indicatorService.calculateAllIndicators(candles);
        const regime = this.classifyRegime(candles);
        // If Regime is UNKNOWN -> Mandatory WAIT
        if (regime === 'UNKNOWN') {
            const emptyScore = {
                emaScore: 0,
                rsiScore: 0,
                macdScore: 0,
                bollingerScore: 0,
                momentumScore: 0,
                volatilityScore: 0,
                totalScore: 0,
                scoreBucket: '0-59 (WAIT)',
                confirmationsCount: 0,
                contributingIndicators: [],
                reasons: ['Market regime could not be classified reliably. Defaulting to WAIT.']
            };
            return {
                signal: 'WAIT',
                score: 0,
                regime: 'UNKNOWN',
                scoreBreakdown: emptyScore,
                fingerprint: 'UNKNOWN_REGIME',
                isCandidate: false,
                isValidHighQuality: false,
                reasons: ['Market regime UNKNOWN. High quality filter requires verified regime.'],
                indicators: computedInd,
                disclaimer: STRATEGY_V2_DISCLAIMER,
                parametersUsed: params,
                timestamp: currentCandle.timestamp
            };
        }
        // Evaluate Both BUY and SELL potential
        const buyScore = this.computeSignalScore('BUY', price, candles, computedInd, regime, params);
        const sellScore = this.computeSignalScore('SELL', price, candles, computedInd, regime, params);
        let chosenDirection = null;
        let chosenBreakdown = buyScore;
        if (regime === 'TRENDING_UP') {
            // In TRENDING_UP, only BUY is allowed
            chosenDirection = 'BUY';
            chosenBreakdown = buyScore;
        }
        else if (regime === 'TRENDING_DOWN') {
            // In TRENDING_DOWN, only SELL is allowed
            chosenDirection = 'SELL';
            chosenBreakdown = sellScore;
        }
        else {
            // RANGING, HIGH_VOLATILITY, LOW_VOLATILITY: Choose higher scored side
            if (buyScore.totalScore >= sellScore.totalScore) {
                chosenDirection = 'BUY';
                chosenBreakdown = buyScore;
            }
            else {
                chosenDirection = 'SELL';
                chosenBreakdown = sellScore;
            }
        }
        // Minimum score threshold calculation
        let threshold = Number(params.minSignalScore || 80);
        if (regime === 'HIGH_VOLATILITY') {
            // High volatility requires strict elevated threshold (>= 85)
            threshold = Math.max(85, threshold);
        }
        const minConfirmations = Number(params.minConfirmations || 3);
        const isValidHighQuality = chosenBreakdown.totalScore >= threshold &&
            chosenBreakdown.confirmationsCount >= minConfirmations;
        const isCandidate = chosenBreakdown.totalScore >= 70;
        let signal = 'WAIT';
        if (isValidHighQuality && chosenDirection) {
            signal = chosenDirection;
        }
        const fingerprint = this.generateFingerprint('ASSET', signal, regime, price, currentCandle.timestamp);
        return {
            signal,
            score: chosenBreakdown.totalScore,
            regime,
            scoreBreakdown: chosenBreakdown,
            fingerprint,
            isCandidate,
            isValidHighQuality,
            reasons: chosenBreakdown.reasons,
            indicators: computedInd,
            disclaimer: STRATEGY_V2_DISCLAIMER,
            parametersUsed: params,
            timestamp: currentCandle.timestamp,
            direction: chosenDirection || undefined,
            evaluatedPrice: price
        };
    }
    /**
     * Generates a deterministic signal fingerprint to detect and suppress duplicate triggers.
     */
    generateFingerprint(asset, direction, regime, price, candleTime) {
        const priceBucket = Math.round(price * 1000) / 1000;
        const timeBucket = Math.floor(candleTime / 60000) * 60000; // 1-minute candle time bucket
        return crypto_1.default
            .createHash('sha256')
            .update(`${asset}_${direction}_${regime}_${priceBucket}_${timeBucket}`)
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Signal Invalidation Check:
     * Returns true if a previously candidate or high-quality signal has been invalidated by new market data.
     */
    isSignalInvalidated(originalSignal, currentPrice, currentIndicators, currentRegime) {
        // 1. Invalidate if regime shifted
        if (currentRegime !== originalSignal.regime) {
            return { invalidated: true, reason: `Regime shifted from ${originalSignal.regime} to ${currentRegime}` };
        }
        // 2. Invalidate if price moved significantly away (> 0.5% drift from evaluated price)
        const basePrice = originalSignal.evaluatedPrice || currentPrice;
        const priceShift = Math.abs(currentPrice - basePrice) / basePrice;
        if (priceShift > 0.005) {
            return { invalidated: true, reason: `Price drifted by ${(priceShift * 100).toFixed(2)}% exceeding invalidation boundary` };
        }
        // 3. Invalidate if indicator confirmation reversed (e.g. MACD histogram crossed opposite sign)
        if (originalSignal.signal === 'BUY' && currentIndicators.macd.histogram < -0.0001) {
            return { invalidated: true, reason: 'MACD histogram turned negative; bullish invalidation' };
        }
        if (originalSignal.signal === 'SELL' && currentIndicators.macd.histogram > 0.0001) {
            return { invalidated: true, reason: 'MACD histogram turned positive; bearish invalidation' };
        }
        return { invalidated: false };
    }
}
exports.StrategyV2Service = StrategyV2Service;
exports.strategyV2Service = new StrategyV2Service();
