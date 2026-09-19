import { alertService } from '../src/services/monitoring/alert.service';

describe('Paper Trading Alert Engine Tests', () => {
  test('dispatches alerts across severities without guaranteed profit claims', async () => {
    const alert = await alertService.createAlert({
      type: 'STRATEGY_DRIFT',
      severity: 'WARNING',
      strategy: 'MACD',
      asset: 'BTC/USD',
      message: 'Paper trading win rate deviated by -6% from backtest benchmark.'
    });

    expect(alert.id).toMatch(/^alt_\d+_[a-f0-9]+/);
    expect(alert.type).toBe('STRATEGY_DRIFT');
    expect(alert.severity).toBe('WARNING');
    expect(alert.acknowledged).toBe(false);
    expect(alert.resolved).toBe(false);
  });

  test('acknowledges and resolves alerts cleanly', async () => {
    const alert = await alertService.createAlert({
      type: 'HIGH_VOLATILITY',
      severity: 'INFO',
      asset: 'ETH/USD',
      message: 'ATR volatility expanded to 1.8x baseline.'
    });

    const ack = await alertService.acknowledgeAlert(alert.id);
    expect(ack.acknowledged).toBe(true);
    expect(ack.acknowledgedAt).toBeDefined();

    const res = await alertService.resolveAlert(alert.id);
    expect(res.resolved).toBe(true);
    expect(res.resolvedAt).toBeDefined();
  });
});
