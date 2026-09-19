import { marketHealthService } from '../src/services/monitoring/marketHealth.service';

describe('Market Data Health Service Tests', () => {
  test('evaluates asset health and flags status without candle fabrication', async () => {
    const health = await marketHealthService.evaluateAssetHealth('BTC/USD', '5m');
    expect(health).toBeDefined();
    expect(health.asset).toBe('BTC/USD');
    expect(health.timeframe).toBe('5m');
    expect(health.candleCount).toBeGreaterThan(0);
    expect(['HEALTHY', 'SIMULATED', 'DELAYED', 'STALE', 'GAP_DETECTED']).toContain(health.status);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    expect(health.lastCandleTimestamp).toBeDefined();
  });

  test('retrieves health status for all primary monitored assets', async () => {
    const allHealth = await marketHealthService.getAllMarketHealth();
    expect(Array.isArray(allHealth)).toBe(true);
    expect(allHealth.length).toBeGreaterThanOrEqual(3);
    const btc = allHealth.find(h => h.asset === 'BTC/USD');
    expect(btc).toBeDefined();
  });
});
