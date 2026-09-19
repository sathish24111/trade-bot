import { signalQualityService } from '../src/services/monitoring/signalQuality.service';

describe('Signal Quality Analytics Tests', () => {
  test('registers paper signal with unique ID and snapshot', async () => {
    const signal = await signalQualityService.registerSignal({
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      direction: 'BUY',
      entryPrice: 50000.0,
      stopLoss: 49500.0,
      takeProfit: 51000.0,
      riskAmount: 100.0,
      confidence: 85.0,
      marketRegime: 'TRENDING',
      indicatorSnapshot: { ema21: 49800, rsi14: 62 }
    });

    expect(signal.signalId).toMatch(/^SIG-\d+-[a-f0-9]+/);
    expect(signal.status).toBe('GENERATED');
    expect(signal.confidence).toBe(85.0);
  });

  test('manages signal lifecycle transitions and records outcomes', async () => {
    const signal = await signalQualityService.registerSignal({
      asset: 'ETH/USD',
      timeframe: '5m',
      strategy: 'MACD',
      direction: 'BUY',
      entryPrice: 3000.0,
      confidence: 75.0
    });

    // Update status to EXECUTED
    const updated = await signalQualityService.updateSignalStatus(signal.signalId, 'EXECUTED');
    expect(updated.status).toBe('EXECUTED');

    // Record outcome
    const outcome = await signalQualityService.recordSignalOutcome({
      signalId: signal.signalId,
      actualEntryPrice: 3000.0,
      actualExitPrice: 3060.0,
      maxFavorableExcursion: 2.5,
      maxAdverseExcursion: -0.5,
      holdingTimeSeconds: 180,
      pnl: 60.0
    });

    expect(outcome.result).toBe('WIN');
    expect(outcome.returnPct).toBe(2.0);
    expect(outcome.maxFavorableExcursion).toBe(2.5);
  });

  test('computes signal quality analytics report', async () => {
    const analytics = await signalQualityService.getSignalAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.totalSignals).toBeGreaterThanOrEqual(1);
    expect(analytics.executedSignals).toBeGreaterThanOrEqual(1);
    expect(analytics.winRate).toBeGreaterThanOrEqual(0.0);
    expect(analytics.expectancy).toBeDefined();
  });
});
