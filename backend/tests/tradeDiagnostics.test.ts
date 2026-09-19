import { tradeDiagnosticsService } from '../src/services/research/tradeDiagnostics.service';

describe('Phase 8: Trade Diagnostics Suite', () => {
  test('Creates and records comprehensive 5-step decision trace and MAE/MFE', async () => {
    const diagnostic = await tradeDiagnosticsService.createDiagnosticForTrade({
      tradeId: 'T_TEST_' + Date.now(),
      asset: 'BTC/USD',
      strategyId: 'EMA_RSI',
      signal: 'BUY',
      entryPrice: 50000,
      exitPrice: 51000,
      amount: 500,
      pnl: 100,
      result: 'WIN',
      marketRegime: 'TRENDING'
    });

    expect(diagnostic).toBeDefined();
    expect(diagnostic.tradeId).toContain('T_TEST_');
    expect(diagnostic.decisionPath.length).toBeGreaterThanOrEqual(4);
    expect(diagnostic.mae).toBeDefined();
    expect(diagnostic.mfe).toBeDefined();
    expect(diagnostic.mode).toBe('PAPER');
    expect(diagnostic.isRealMoney).toBe(false);

    // Retrieve from service
    const retrieved = await tradeDiagnosticsService.getTradeDiagnostic(diagnostic.tradeId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.tradeId).toBe(diagnostic.tradeId);
  });
});
