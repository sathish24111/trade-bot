import { portfolioService } from '../src/services/research/portfolio.service';

describe('Portfolio Paper Simulation Tests', () => {
  it('calculates Pearson correlation coefficient accurately between return series', () => {
    const seriesA = [0.01, 0.02, -0.01, 0.03, -0.02];
    const seriesB = [0.01, 0.02, -0.01, 0.03, -0.02]; // Perfectly correlated
    const corrIdentical = portfolioService.calculatePearsonCorrelation(seriesA, seriesB);
    expect(corrIdentical).toBe(1.0);

    const seriesC = [-0.01, -0.02, 0.01, -0.03, 0.02]; // Perfectly inverse
    const corrInverse = portfolioService.calculatePearsonCorrelation(seriesA, seriesC);
    expect(corrInverse).toBe(-1.0);
  });

  it('rejects portfolio creations where allocation weights exceed 100%', async () => {
    await expect(
      portfolioService.createPortfolio({
        userId: 1,
        name: 'Over-allocated Portfolio',
        initialCapital: 10000,
        allocations: [
          { asset: 'BTC/USD', strategy: 'EMA_RSI', weightPercent: 60 },
          { asset: 'ETH/USD', strategy: 'MACD', weightPercent: 50 }
        ]
      })
    ).rejects.toThrow(/exceeds maximum limit of 100%/);
  });

  it('correctly allocates capital proportionally across multiple assets', async () => {
    const portfolio = await portfolioService.createPortfolio({
      userId: 1,
      name: 'Balanced Portfolio',
      initialCapital: 10000,
      allocations: [
        { asset: 'BTC/USD', strategy: 'EMA_RSI', weightPercent: 40 },
        { asset: 'ETH/USD', strategy: 'MACD', weightPercent: 30 }
      ],
      maxPortfolioDrawdownPercent: 10
    });

    expect(portfolio.allocations[0].allocatedCapital).toBe(4000);
    expect(portfolio.allocations[1].allocatedCapital).toBe(3000);
    expect(portfolio.maxPortfolioDrawdownPercent).toBe(10);
  });
});
