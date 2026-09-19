import { portfolioExposureService } from '../src/services/monitoring/portfolioExposure.service';

describe('Portfolio Exposure & Limit Guard Tests', () => {
  test('calculates gross, net, asset, and strategy exposures accurately', async () => {
    const summary = await portfolioExposureService.calculatePortfolioExposure({
      totalEquity: 10000.0,
      cashBalance: 8000.0,
      positions: [
        {
          asset: 'BTC/USD',
          strategy: 'EMA_RSI',
          direction: 'BUY',
          amount: 1000.0,
          unrealizedPnl: 20.0
        },
        {
          asset: 'ETH/USD',
          strategy: 'MACD',
          direction: 'SELL',
          amount: 1000.0,
          unrealizedPnl: -10.0
        }
      ],
      dailyLoss: 0.0,
      currentDrawdown: 1.0
    });

    expect(summary.grossExposure).toBe(20.0); // 2000 / 10000 * 100
    expect(summary.netExposure).toBe(0.0);   // Long 1000 - Short 1000 = 0
    expect(summary.assetExposure['BTC/USD']).toBe(10.0);
    expect(summary.isNewTradeBlocked).toBe(false);
  });

  test('blocks new paper trades when gross exposure limit is breached', async () => {
    const summary = await portfolioExposureService.calculatePortfolioExposure({
      totalEquity: 10000.0,
      cashBalance: 1000.0,
      positions: [
        {
          asset: 'BTC/USD',
          strategy: 'EMA_RSI',
          direction: 'BUY',
          amount: 9000.0, // 90% > 80% limit
          unrealizedPnl: 0.0
        }
      ],
      dailyLoss: 0.0,
      currentDrawdown: 2.0
    });

    expect(summary.grossExposure).toBe(90.0);
    expect(summary.isNewTradeBlocked).toBe(true);
    expect(summary.status).toContain('BLOCK_NEW_TRADE');
  });
});
