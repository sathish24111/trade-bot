import { riskService, RiskService } from '../src/services/risk.service';

describe('RiskService Tests', () => {
  test('Risk percent mapping according to specifications', () => {
    expect(RiskService.getRiskPercent('LOW')).toBe(0.005);   // 0.5%
    expect(RiskService.getRiskPercent('MEDIUM')).toBe(0.01); // 1.0%
    expect(RiskService.getRiskPercent('HIGH')).toBe(0.02);   // 2.0%
  });

  test('Daily loss limit triggers when cumulative P/L exceeds 5% of starting balance', () => {
    const startingBalance = 10000;
    // 5% of 10,000 is 500. A loss of -500 or worse must trigger the limit
    const breachResult = riskService.checkRiskRules(startingBalance, -500.01, 0);
    expect(breachResult.allowed).toBe(false);
    expect(breachResult.isDailyLossExceeded).toBe(true);
    expect(breachResult.reason).toContain('Demo daily loss limit reached');

    const safeResult = riskService.checkRiskRules(startingBalance, -200, 0);
    expect(safeResult.allowed).toBe(true);
  });

  test('Concurrent trades limit enforced (max 1 trade)', () => {
    const checkWithActiveTrade = riskService.checkRiskRules(10000, 50, 1);
    expect(checkWithActiveTrade.allowed).toBe(false);
    expect(checkWithActiveTrade.reason).toContain('Maximum concurrent');
  });

  test('Calculates trade amount within safe bounds', () => {
    const amount = riskService.calculateTradeAmount(500, 'LOW');
    expect(amount).toBeGreaterThanOrEqual(10);
    expect(amount).toBeLessThanOrEqual(250);
  });
});
