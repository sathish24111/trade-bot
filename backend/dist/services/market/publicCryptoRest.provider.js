"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicCryptoRestProvider = exports.PublicCryptoRestProvider = void 0;
const dataQualityGate_service_1 = require("./dataQualityGate.service");
const indicator_service_1 = require("../indicator.service");
class PublicCryptoRestProvider {
    name = 'crypto-rest-fallback';
    state = 'HEALTHY';
    supported = [
        { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', binancePair: 'BTCUSDT', defaultPrice: 64750 },
        { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', binancePair: 'ETHUSDT', defaultPrice: 3460 }
    ];
    cache = new Map();
    errorCount = 0;
    requestCount = 0;
    lastRequestTime = 0;
    latencyMs = 0;
    getState() {
        return this.state;
    }
    setState(s) {
        this.state = s;
    }
    supportsAsset(symbol) {
        const clean = symbol.toUpperCase().replace('-', '/');
        return this.supported.some(s => s.symbol === clean || s.binancePair === symbol.toUpperCase());
    }
    mapTimeframe(tf) {
        switch (tf) {
            case '1m': return '1m';
            case '5m': return '5m';
            case '15m': return '15m';
            case '1h': return '1h';
            case '4h': return '4h';
            case '1D': return '1d';
            default: return '5m';
        }
    }
    async getQuote(symbol, timeframe = '5m') {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by PublicCryptoRestProvider`);
        }
        return {
            asset: asset.symbol,
            timeframe,
            price: asset.price,
            timestamp: new Date().toISOString(),
            source: 'LIVE READ-ONLY DATA (Crypto REST Fallback)',
            isLive: asset.isLive,
            status: asset.status,
            change24h: asset.change24h,
            changePercent: asset.changePercent
        };
    }
    async getCandles(symbol, timeframe = '5m', count = 60) {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by PublicCryptoRestProvider`);
        }
        return asset.candles.slice(-count);
    }
    async getAllAssets() {
        const results = [];
        for (const def of this.supported) {
            const asset = await this.getAsset(def.symbol);
            if (asset)
                results.push(asset);
        }
        return results;
    }
    async getAsset(symbol, timeframe = '5m') {
        const clean = symbol.toUpperCase().replace('-', '/');
        const def = this.supported.find(s => s.symbol === clean || s.binancePair === symbol.toUpperCase());
        if (!def)
            return null;
        const cacheKey = `${clean}_${timeframe}`;
        const cached = this.cache.get(cacheKey);
        const now = Date.now();
        // Cache valid for 5 seconds to reduce rate limits
        if (cached && now - cached.cachedAt < 5000) {
            return cached.asset;
        }
        this.requestCount++;
        this.lastRequestTime = now;
        const t0 = Date.now();
        try {
            const interval = this.mapTimeframe(timeframe);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const [tickerRes, klinesRes] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${def.binancePair}`, { signal: controller.signal }),
                fetch(`https://api.binance.com/api/v3/klines?symbol=${def.binancePair}&interval=${interval}&limit=60`, { signal: controller.signal })
            ]);
            clearTimeout(timeoutId);
            this.latencyMs = Math.max(1, Date.now() - t0);
            if (tickerRes.ok && klinesRes.ok) {
                const ticker = await tickerRes.json();
                const klines = await klinesRes.json();
                const candles = [];
                for (const k of klines) {
                    const c = {
                        timestamp: Number(k[0]),
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseFloat(k[5])
                    };
                    const validation = dataQualityGate_service_1.dataQualityGate.validateCandle(clean, c);
                    if (validation.isValid) {
                        candles.push(c);
                    }
                }
                const price = parseFloat(ticker.lastPrice || def.defaultPrice.toString());
                const change24h = parseFloat(ticker.priceChange || '0');
                const changePercent = parseFloat(ticker.priceChangePercent || '0');
                const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
                const asset = {
                    symbol: clean,
                    name: def.name,
                    price,
                    change24h,
                    changePercent,
                    trend: indicators.ema21 > indicators.sma50 ? 'BULLISH' : 'BEARISH',
                    demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
                    confidence: 80,
                    reason: 'Public REST Fallback',
                    indicators,
                    candles,
                    dataSource: 'LIVE READ-ONLY DATA (Crypto REST Fallback)',
                    status: 'LIVE_READ_ONLY',
                    isLive: true,
                    timeframe
                };
                this.cache.set(cacheKey, { asset, cachedAt: now });
                this.state = 'HEALTHY';
                return asset;
            }
            else {
                throw new Error(`REST response not ok: ${tickerRes.status}`);
            }
        }
        catch {
            this.errorCount++;
            this.state = 'DEGRADED';
            if (cached) {
                return {
                    ...cached.asset,
                    dataSource: 'LIVE READ-ONLY DATA (Crypto REST Cached)',
                    status: 'CACHED'
                };
            }
            // Safe fallback data
            const candles = [];
            for (let i = 59; i >= 0; i--) {
                const time = now - i * 300000;
                const p = def.defaultPrice * (1 + (Math.random() - 0.5) * 0.005);
                candles.push({
                    timestamp: time,
                    open: p * 0.999,
                    high: p * 1.002,
                    low: p * 0.998,
                    close: p,
                    volume: 5 + Math.random() * 20
                });
            }
            const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
            const fallbackAsset = {
                symbol: clean,
                name: def.name,
                price: def.defaultPrice,
                change24h: 0,
                changePercent: 0,
                trend: 'NEUTRAL',
                demoSignal: 'WAIT',
                confidence: 50,
                reason: 'REST Fallback Offline Simulated',
                indicators,
                candles,
                dataSource: 'SIMULATED DATA (Fallback Offline)',
                status: 'SIMULATED',
                isLive: false,
                timeframe
            };
            return fallbackAsset;
        }
    }
}
exports.PublicCryptoRestProvider = PublicCryptoRestProvider;
exports.publicCryptoRestProvider = new PublicCryptoRestProvider();
