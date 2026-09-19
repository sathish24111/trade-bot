import { strategyEngine } from '../src/services/strategy.service';
import { MarketAsset } from '../src/models/MarketData';

describe('StrategyEngine Tests', () => {
  const sampleBullishAsset: MarketAsset = {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: 1.08500,
    change24h: 0.0020,
    changePercent: 0.2,
    trend: 'BULLISH',
    demoSignal: 'BUY',
    confidence: 75,
    reason: 'Bullish trend test',
    indicators: {
      ema21: 1.08200,
      sma20: 1.08150,
      sma50: 1.08000,
      rsi14: 62.5,
      macd: { value: 0.0005, signal: 0.0002, histogram: 0.0003 },
      bollinger: { upper: 1.08900, middle: 1.08300, lower: 1.07700 },
      atr14: 0.0015
    },
    candles: [],
    dataSource: 'SIMULATED MARKET DATA',
    status: 'SIMULATED',
    isLive: false
  };

  test('EMA_RSI strategy generates BUY for bullish configuration', () => {
    const result = strategyEngine.evaluate('EMA_RSI', sampleBullishAsset);
    expect(result.signal).toBe('BUY');
    expect(result.confidence).toBeGreaterThanOrEqual(50);
    expect(result.disclaimer).toContain('No signal guarantees profit');
    expect(result.reason).toContain('Price (1.085)');
  });

  test('MACD strategy generates BUY for positive macd histogram', () => {
    const result = strategyEngine.evaluate('MACD', sampleBullishAsset);
    expect(result.signal).toBe('BUY');
    expect(result.reason).toContain('crossed above signal');
  });

  test('MultiIndicator strategy consensus evaluation', () => {
    const result = strategyEngine.evaluate('MULTI_INDICATOR', sampleBullishAsset);
    expect(['BUY', 'SELL', 'WAIT']).toContain(result.signal);
    expect(result.disclaimer).toBeDefined();
    expect(result.reason).toBeDefined();
  });
});
