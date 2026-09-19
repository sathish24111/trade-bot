import { anomalyDetectionService } from '../src/services/monitoring/anomalyDetection.service';

describe('Market & Trade Anomaly Detection Tests', () => {
  test('flags extreme price spikes on single bars', async () => {
    const anomaly = await anomalyDetectionService.checkCandleAnomaly('BTC/USD', {
      open: 50000.0,
      high: 60000.0,
      low: 49000.0,
      close: 58000.0, // 16% jump
      timestamp: String(Date.now())
    });

    expect(anomaly).toBeDefined();
    expect(anomaly?.type).toBe('PRICE_SPIKE');
    expect(anomaly?.severity).toBe('WARNING');
  });

  test('flags impossible OHLC structures and negative prices', async () => {
    const anomaly = await anomalyDetectionService.checkCandleAnomaly('ETH/USD', {
      open: 3000.0,
      high: 2800.0, // High < Low!
      low: 2900.0,
      close: 2950.0,
      timestamp: String(Date.now())
    });

    expect(anomaly).toBeDefined();
    expect(anomaly?.type).toBe('IMPOSSIBLE_PRICE');
    expect(anomaly?.severity).toBe('HIGH');
  });

  test('detects abnormal slippage and negative balances', async () => {
    const slippageAnomaly = await anomalyDetectionService.checkExecutionAnomaly({
      asset: 'BTC/USD',
      expectedPrice: 50000.0,
      actualPrice: 51500.0,
      slippage: 0.03 // 3% > 2%
    });
    expect(slippageAnomaly?.type).toBe('ABNORMAL_SLIPPAGE');

    const balAnomaly = await anomalyDetectionService.checkBalanceAnomaly('BTC/USD', -50.0, -100.0);
    expect(balAnomaly?.type).toBe('INVALID_VALUES');
  });
});
