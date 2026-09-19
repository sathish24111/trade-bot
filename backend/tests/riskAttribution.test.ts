import { riskAttributionService } from '../src/services/research/riskAttribution.service';

describe('Phase 8: Risk Attribution Suite', () => {
  test('Rejects allocations whose sum exceeds 100%', () => {
    expect(() => {
      riskAttributionService.calculateRiskAttribution({
        allocations: [
          { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.60, targetCapital: 6000 },
          { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.50, targetCapital: 5000 }
        ]
      });
    }).toThrow(/exceeds/i);
  });

  test('Calculates HHI (concentration risk) and proportional risk accurately', () => {
    // Equal 50/50 allocation -> HHI = (50)^2 + (50)^2 = 2500 + 2500 = 5000
    const attribution = riskAttributionService.calculateRiskAttribution({
      allocations: [
        { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.50, targetCapital: 5000 },
        { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.50, targetCapital: 5000 }
      ]
    });

    expect(attribution).toBeDefined();
    expect(attribution.concentrationRisk.herfindahlIndex).toBeCloseTo(5000, 0);
    expect(attribution.concentrationRisk.riskRating).toBe('MODERATE');
    expect(attribution.totalPortfolioRisk).toBe(100.0);
    expect(attribution.strategyAttributions.length).toBe(2);
    
    // Sum of risk contribution percentages should equal ~100%
    const sumRiskPct = attribution.strategyAttributions.reduce((acc, s) => acc + s.riskContributionPct, 0);
    expect(sumRiskPct).toBeCloseTo(100.0, 1);
  });

  test('High concentration scenario results in HIGH concentration risk level', () => {
    // Single 95% allocation -> HHI > 5000
    const attribution = riskAttributionService.calculateRiskAttribution({
      allocations: [
        { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.95, targetCapital: 9500 },
        { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.05, targetCapital: 500 }
      ]
    });

    expect(attribution.concentrationRisk.riskRating).toBe('HIGH');
    expect(attribution.concentrationRisk.herfindahlIndex).toBeGreaterThan(5000);
  });
});
