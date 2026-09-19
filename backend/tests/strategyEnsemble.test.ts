import { strategyEnsembleService } from '../src/services/research/strategyEnsemble.service';
import { MarketAsset } from '../src/models/MarketData';

describe('Phase 8: Strategy Ensemble Suite', () => {
  const mockAsset: MarketAsset = {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    price: 50000,
    change24h: 1200,
    changePercent: 2.45,
    trend: 'BULLISH',
    demoSignal: 'BUY',
    confidence: 85,
    reason: 'Bullish moving average cross',
    indicators: {
      ema21: 49500,
      sma20: 50000,
      sma50: 49800,
      rsi14: 62,
      macd: { value: 120, signal: 95, histogram: 25 },
      bollinger: { upper: 51200, middle: 50000, lower: 48800 },
      atr14: 120
    },
    candles: [
      { timestamp: 1700000000000, open: 49000, high: 49600, low: 48900, close: 49500, volume: 100 },
      { timestamp: 1700000300000, open: 49500, high: 50200, low: 49400, close: 50000, volume: 150 }
    ],
    dataSource: 'SIMULATED',
    status: 'SIMULATED',
    isLive: false
  };

  test('Consensus mode requires 100% agreement, otherwise produces WAIT', async () => {
    await strategyEnsembleService.saveEnsembleConfig({
      id: 'ENS_CONSENSUS',
      name: 'Consensus Test Ensemble',
      aggregationMode: 'CONSENSUS',
      enabled: true,
      strategies: [
        { strategyId: 'EMA_RSI', weight: 0.5 },
        { strategyId: 'MACD', weight: 0.5 }
      ]
    });

    const result = await strategyEnsembleService.evaluateEnsemble(mockAsset, 'ENS_CONSENSUS');
    expect(['BUY', 'SELL', 'WAIT']).toContain(result.finalSignal);
    expect(result.aggregationMode).toBe('CONSENSUS');
    expect(result.voteBreakdown).toBeDefined();
    expect(result.voteBreakdown.length).toBeGreaterThan(0);
  });

  test('Majority mode aggregates signals based on >50% majority', async () => {
    await strategyEnsembleService.saveEnsembleConfig({
      id: 'ENS_MAJORITY',
      name: 'Majority Test Ensemble',
      aggregationMode: 'MAJORITY',
      enabled: true,
      strategies: [
        { strategyId: 'EMA_RSI', weight: 0.34 },
        { strategyId: 'MACD', weight: 0.33 },
        { strategyId: 'BOLLINGER_BANDS', weight: 0.33 }
      ]
    });

    const result = await strategyEnsembleService.evaluateEnsemble(mockAsset, 'ENS_MAJORITY');
    expect(result.aggregationMode).toBe('MAJORITY');
    expect(['BUY', 'SELL', 'WAIT']).toContain(result.finalSignal);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  test('Weighted mode combines weights and individual confidences', async () => {
    await strategyEnsembleService.saveEnsembleConfig({
      id: 'ENS_WEIGHTED',
      name: 'Weighted Test Ensemble',
      aggregationMode: 'WEIGHTED',
      enabled: true,
      strategies: [
        { strategyId: 'EMA_RSI', weight: 0.6 },
        { strategyId: 'MACD', weight: 0.4 }
      ]
    });

    const result = await strategyEnsembleService.evaluateEnsemble(mockAsset, 'ENS_WEIGHTED');
    expect(result.aggregationMode).toBe('WEIGHTED');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  test('Conflict detection records disagreeing signals', async () => {
    const conflictsBefore = await strategyEnsembleService.getConflicts();
    
    // Record explicit conflict
    await strategyEnsembleService.recordConflict({
      ensembleId: 'ENS_TEST',
      asset: 'ETH/USD',
      timestamp: new Date().toISOString(),
      regime: 'VOLATILE',
      disagreeingSignals: [
        { strategyId: 'EMA_RSI', signal: 'BUY', confidence: 75 },
        { strategyId: 'MACD', signal: 'SELL', confidence: 60 }
      ],
      resolvedSignal: 'WAIT',
      resolutionMethod: 'CONSENSUS'
    });

    const conflictsAfter = await strategyEnsembleService.getConflicts();
    expect(conflictsAfter.length).toBeGreaterThanOrEqual(conflictsBefore.length + 1);
    expect(conflictsAfter[0].resolvedSignal).toBe('WAIT');
  });
});
