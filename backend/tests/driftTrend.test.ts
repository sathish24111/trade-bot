import { driftTrendService } from '../src/services/research/driftTrend.service';

describe('Phase 9 Drift Trend Analysis Test Suite', () => {
  test('Classifies stable drift trajectory with positive expectancy', () => {
    const trades = [
      { pnl: 40, slippage: 0.0001, fee: 1.0 },
      { pnl: 50, slippage: 0.0001, fee: 1.0 },
      { pnl: -20, slippage: 0.0001, fee: 1.0 },
      { pnl: 30, slippage: 0.0001, fee: 1.0 },
      { pnl: 60, slippage: 0.0001, fee: 1.0 },
      { pnl: -10, slippage: 0.0001, fee: 1.0 },
      { pnl: 45, slippage: 0.0001, fee: 1.0 }
    ];

    const result = driftTrendService.analyzeDriftTrend({
      strategyId: 'EMA_RSI',
      trades,
      baselineWinRate: 71.43
    });

    expect(result.strategyId).toBe('EMA_RSI');
    expect(result.windows.length).toBeGreaterThan(0);
    expect(result.trend).toBe('STABLE');
    expect(result.windows[0].windowSize).toBe(7);
    expect(result.windows[0].winRate).toBeGreaterThan(50);
  });


  test('Classifies degrading drift when win rate drops drastically', () => {
    const losingTrades = [
      { pnl: -50, slippage: 0.0002, fee: 1.0 },
      { pnl: -40, slippage: 0.0002, fee: 1.0 },
      { pnl: -60, slippage: 0.0002, fee: 1.0 },
      { pnl: -30, slippage: 0.0002, fee: 1.0 },
      { pnl: 10, slippage: 0.0002, fee: 1.0 },
      { pnl: -45, slippage: 0.0002, fee: 1.0 },
      { pnl: -55, slippage: 0.0002, fee: 1.0 }
    ];

    const result = driftTrendService.analyzeDriftTrend({
      strategyId: 'MACD',
      trades: losingTrades,
      baselineWinRate: 65.0
    });

    expect(result.trend).toBe('DEGRADING');
    expect(result.windows[0].driftPercentage).toBeGreaterThan(15.0);
  });

  test('Returns INSUFFICIENT_DATA when trades count is below minimum window', () => {
    const result = driftTrendService.analyzeDriftTrend({
      strategyId: 'BOLLINGER_BANDS',
      trades: [{ pnl: 10 }, { pnl: -5 }]
    });

    expect(result.trend).toBe('INSUFFICIENT_DATA');
    expect(result.windows.length).toBe(0);
  });
});
