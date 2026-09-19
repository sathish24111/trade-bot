import { stressTestService } from '../src/services/research/stressTest.service';

describe('Stress Testing Engine Tests', () => {
  it('runs stress testing across cost multipliers and risk levels', async () => {
    const report = await stressTestService.runStressTest(
      'EMA_RSI',
      'BTC/USD',
      '5m',
      undefined,
      60,
      1
    );

    expect(report.strategy).toBe('EMA_RSI');
    expect(report.scenarios.length).toBeGreaterThanOrEqual(4);
    expect(report.disclaimer).toBeTruthy();
    expect(report.mode).toBe('PAPER');
    expect(report.isRealMoney).toBe(false);

    // Verify cost multipliers are represented
    const multipliers = report.scenarios.map((s) => s.costMultiplier);
    expect(multipliers).toContain(1.0);
    expect(multipliers).toContain(2.0);
  });
});
