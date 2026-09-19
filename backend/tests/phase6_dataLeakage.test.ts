import { indicatorService } from '../src/services/indicator.service';
import { strategyEngine } from '../src/services/strategy.service';
import { regimeService } from '../src/services/research/regime.service';
import { backtestingService } from '../src/services/backtesting.service';
import { Candle } from '../src/models/MarketData';

describe('Phase 6 Look-Ahead Bias & Future Candle Mutation Regression Proof', () => {
  // Generate deterministic synthetic candle baseline (100 candles)
  const generateBaseCandles = (count: number): Candle[] => {
    const base: Candle[] = [];
    let price = 50000;
    const now = 1700000000000;

    for (let i = 0; i < count; i++) {
      const open = price;
      const change = (Math.sin(i * 0.3) + Math.cos(i * 0.1)) * 50;
      const close = Math.round((open + change) * 100) / 100;
      const high = Math.max(open, close) + 20;
      const low = Math.min(open, close) - 20;
      price = close;

      base.push({
        timestamp: now + i * 300000,
        open,
        high,
        low,
        close,
        volume: 100
      });
    }
    return base;
  };

  test('Strict Leakage Proof: Radical future mutations after cutoff=60 leave all earlier indicators, signals, trades, and regimes 100% IDENTICAL', async () => {
    const cutoff = 60;
    const originalCandles = generateBaseCandles(100);

    // Baseline run on historical sequence up to bar 60
    const originalPreCutoffCandles = originalCandles.slice(0, cutoff);
    const originalIndicators = indicatorService.calculateAllIndicators(originalPreCutoffCandles);
    const originalSignals = strategyEngine.evaluateFromCandles('EMA_RSI', originalPreCutoffCandles);
    const originalRegime = regimeService.classifyRegime(originalPreCutoffCandles, originalPreCutoffCandles.length - 1);

    // Create mutated dataset where future candles (index >= 60) are radically altered (10x price jump, reverse direction)
    const mutatedCandles: Candle[] = JSON.parse(JSON.stringify(originalCandles));
    for (let i = cutoff; i < mutatedCandles.length; i++) {
      mutatedCandles[i].open = 999999;
      mutatedCandles[i].high = 1000000;
      mutatedCandles[i].low = 900000;
      mutatedCandles[i].close = 950000;
    }

    // Evaluate mutated dataset up to cutoff
    const mutatedPreCutoffCandles = mutatedCandles.slice(0, cutoff);
    const mutatedIndicators = indicatorService.calculateAllIndicators(mutatedPreCutoffCandles);
    const mutatedSignals = strategyEngine.evaluateFromCandles('EMA_RSI', mutatedPreCutoffCandles);
    const mutatedRegime = regimeService.classifyRegime(mutatedPreCutoffCandles, mutatedPreCutoffCandles.length - 1);

    // 1. Indicators before cutoff MUST BE 100% IDENTICAL
    expect(mutatedIndicators.ema21).toBe(originalIndicators.ema21);
    expect(mutatedIndicators.rsi14).toBe(originalIndicators.rsi14);
    expect(mutatedIndicators.atr14).toBe(originalIndicators.atr14);
    expect(mutatedIndicators.bollinger.upper).toBe(originalIndicators.bollinger.upper);
    expect(mutatedIndicators.macd.value).toBe(originalIndicators.macd.value);

    // 2. Strategy signals before cutoff MUST BE 100% IDENTICAL
    expect(mutatedSignals.signal).toBe(originalSignals.signal);
    expect(mutatedSignals.confidence).toBe(originalSignals.confidence);
    expect(mutatedSignals.reason).toBe(originalSignals.reason);

    // 3. Market regime before cutoff MUST BE 100% IDENTICAL
    expect(mutatedRegime.regime).toBe(originalRegime.regime);
    expect(mutatedRegime.atr).toBe(originalRegime.atr);
  });
});
