import { riskMonitorService } from '../src/services/monitoring/riskMonitor.service';

describe('Real-Time Risk Dashboard Tests', () => {
  test('evaluates risk state and utilization percentage', async () => {
    const state = await riskMonitorService.evaluateRiskState({
      startingBalance: 10000.0,
      currentBalance: 9800.0,
      peakBalance: 10000.0,
      openPositions: [{ amount: 1000.0, stopLossDistancePct: 0.01 }],
      consecutiveLosses: 1,
      dailyPnL: -200.0
    });

    expect(state).toBeDefined();
    expect(state.dailyPnL).toBe(-200.0);
    expect(state.dailyLossPct).toBe(2.0); // 200 / 10000 = 2%
    expect(state.currentDrawdown).toBe(2.0);
    expect(state.riskUtilization).toBe(40.0); // 200 / 500 max loss = 40%
    expect(state.riskState).toBe('ELEVATED');
  });

  test('triggers LIMIT_REACHED state when daily loss exceeds 5%', async () => {
    const state = await riskMonitorService.evaluateRiskState({
      startingBalance: 10000.0,
      currentBalance: 9400.0,
      peakBalance: 10000.0,
      openPositions: [],
      consecutiveLosses: 4,
      dailyPnL: -600.0 // 6% > 5% max daily loss
    });

    expect(state.dailyLossPct).toBe(6.0);
    expect(state.riskUtilization).toBe(100.0);
    expect(state.riskState).toBe('LIMIT_REACHED');
  });
});
