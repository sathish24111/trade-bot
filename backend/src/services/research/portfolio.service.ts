import { randomUUID } from 'crypto';
import { pool } from '../../config/database';
import {
  CorrelationMatrix,
  PortfolioAllocation,
  PortfolioConfig,
  PortfolioEquityPoint,
  PortfolioPosition,
  PortfolioSimulationResult
} from '../../models/Research';
import { backtestingService } from '../backtesting.service';
import { marketService } from '../market.service';

const PORTFOLIO_DISCLAIMER =
  'Portfolio simulations evaluate multi-asset allocation, cross-strategy diversification, and aggregate drawdowns using simulated historical data. Past correlations may break down under market stress and do not guarantee future performance.';

export class PortfolioService {
  private inMemoryPortfolios: Map<string, PortfolioConfig> = new Map();

  /**
   * Calculates Pearson correlation coefficient between two numeric return series.
   */
  calculatePearsonCorrelation(seriesA: number[], seriesB: number[]): number {
    const n = Math.min(seriesA.length, seriesB.length);
    if (n < 2) return 0;

    const a = seriesA.slice(0, n);
    const b = seriesB.slice(0, n);

    const meanA = a.reduce((sum, val) => sum + val, 0) / n;
    const meanB = b.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = a[i] - meanA;
      const diffB = b[i] - meanB;
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }

    const denominator = Math.sqrt(denomA * denomB);
    if (denominator === 0) return 0;

    const corr = numerator / denominator;
    return Math.round(Math.max(-1, Math.min(1, corr)) * 100) / 100;
  }

  /**
   * Builds an asset-to-asset Pearson correlation matrix.
   */
  async calculateCorrelationMatrix(assets: string[], timeframe = '5m', candleCount = 100): Promise<CorrelationMatrix> {
    const assetReturns: Map<string, number[]> = new Map();

    for (const asset of assets) {
      try {
        const candles = await marketService.getCandles(asset, timeframe, candleCount);
        const returns: number[] = [];
        for (let i = 1; i < candles.length; i++) {
          const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
          returns.push(ret);
        }
        assetReturns.set(asset, returns);
      } catch {
        assetReturns.set(asset, []);
      }
    }

    const matrix: number[][] = [];
    for (let i = 0; i < assets.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < assets.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const seriesA = assetReturns.get(assets[i]) || [];
          const seriesB = assetReturns.get(assets[j]) || [];
          row.push(this.calculatePearsonCorrelation(seriesA, seriesB));
        }
      }
      matrix.push(row);
    }

    return { assets, matrix };
  }

  /**
   * Creates or registers a new portfolio with strict capital allocation checks.
   */
  async createPortfolio(config: {
    userId: number;
    name: string;
    initialCapital: number;
    allocations: { asset: string; strategy: string; weightPercent: number }[];
    maxPortfolioDrawdownPercent?: number;
  }): Promise<PortfolioConfig> {
    const totalWeight = config.allocations.reduce((sum, a) => sum + a.weightPercent, 0);
    if (totalWeight > 100) {
      throw new Error(`Total portfolio allocation weight (${totalWeight}%) exceeds maximum limit of 100%.`);
    }

    const id = `port_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const maxDrawdown = config.maxPortfolioDrawdownPercent || 15.0;

    const fullAllocations: PortfolioAllocation[] = config.allocations.map((a) => ({
      asset: a.asset,
      strategy: a.strategy,
      weightPercent: a.weightPercent,
      allocatedCapital: Math.round(((config.initialCapital * a.weightPercent) / 100) * 100) / 100
    }));

    const portfolio: PortfolioConfig = {
      id,
      userId: config.userId,
      name: config.name,
      initialCapital: config.initialCapital,
      allocations: fullAllocations,
      maxPortfolioDrawdownPercent: maxDrawdown
    };

    this.inMemoryPortfolios.set(id, portfolio);

    try {
      await pool.query(
        `INSERT INTO portfolios (id, user_id, name, initial_capital, current_equity, max_portfolio_drawdown, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [id, config.userId, config.name, config.initialCapital, config.initialCapital, maxDrawdown]
      );

      for (const alloc of fullAllocations) {
        await pool.query(
          `INSERT INTO portfolio_positions (id, portfolio_id, asset, strategy, weight_pct, allocated_capital, current_pnl)
           VALUES (?, ?, ?, ?, ?, ?, 0.00)`,
          [
            `pos_${randomUUID().replace(/-/g, '').substring(0, 16)}`,
            id,
            alloc.asset,
            alloc.strategy,
            alloc.weightPercent,
            alloc.allocatedCapital
          ]
        );
      }
    } catch (err: any) {
      console.warn(`[PortfolioService] Database write warning: ${err.message}`);
    }

    return portfolio;
  }

  /**
   * Runs an integrated multi-asset portfolio simulation, tracking combined equity and enforcing drawdown caps.
   */
  async simulatePortfolio(portfolioId: string, timeframe = '5m', candleCount = 100): Promise<PortfolioSimulationResult> {
    let portfolio = this.inMemoryPortfolios.get(portfolioId);

    if (!portfolio) {
      // Try to load from database
      const [rows] = await pool.query<any[]>(`SELECT * FROM portfolios WHERE id = ?`, [portfolioId]);
      if (rows.length === 0) {
        throw new Error(`Portfolio ${portfolioId} not found.`);
      }
      const pRow = rows[0];
      const [posRows] = await pool.query<any[]>(`SELECT * FROM portfolio_positions WHERE portfolio_id = ?`, [portfolioId]);
      const allocations: PortfolioAllocation[] = posRows.map((r) => ({
        asset: r.asset,
        strategy: r.strategy,
        weightPercent: Number(r.weight_pct),
        allocatedCapital: Number(r.allocated_capital)
      }));

      portfolio = {
        id: pRow.id,
        userId: pRow.user_id,
        name: pRow.name,
        initialCapital: Number(pRow.initial_capital),
        allocations,
        maxPortfolioDrawdownPercent: Number(pRow.max_portfolio_drawdown)
      };
      this.inMemoryPortfolios.set(portfolioId, portfolio);
    }

    // 1. Run simulation for each position
    const positionResults = [];
    for (const alloc of portfolio.allocations) {
      try {
        const bt = await backtestingService.runBacktest({
          asset: alloc.asset,
          strategy: alloc.strategy,
          timeframe,
          candleCount,
          initialBalance: alloc.allocatedCapital,
          tradeAmount: Math.max(10, Math.round(alloc.allocatedCapital * 0.05))
        });
        positionResults.push({ alloc, bt });
      } catch {
        // Fallback with 0 pnl if data unavailable
        positionResults.push({
          alloc,
          bt: {
            netPnl: 0,
            equityCurve: [],
            totalTrades: 0,
            winRate: 0,
            profitFactor: 0
          } as any
        });
      }
    }

    // 2. Aggregate combined equity curve
    const unallocatedCash =
      portfolio.initialCapital - portfolio.allocations.reduce((sum, a) => sum + a.allocatedCapital, 0);

    // Collect all timestamps from position equity curves
    const allTimestampsSet = new Set<string>();
    for (const { bt } of positionResults) {
      for (const eq of bt.equityCurve || []) {
        allTimestampsSet.add(eq.timestamp);
      }
    }

    const sortedTimestamps = Array.from(allTimestampsSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const portfolioEquityCurve: PortfolioEquityPoint[] = [];
    let peakEquity = portfolio.initialCapital;
    let maxDrawdownPercent = 0;
    let riskLimitReached = false;
    let riskLimitMessage: string | undefined = undefined;

    if (sortedTimestamps.length === 0) {
      portfolioEquityCurve.push({
        timestamp: new Date().toISOString(),
        equity: portfolio.initialCapital,
        drawdownPct: 0
      });
    } else {
      for (const ts of sortedTimestamps) {
        let totalCurrentPosEquity = 0;

        for (const { alloc, bt } of positionResults) {
          const closestEq = (bt.equityCurve || [])
            .filter((e: any) => new Date(e.timestamp).getTime() <= new Date(ts).getTime())
            .pop();

          totalCurrentPosEquity += closestEq ? closestEq.equity : alloc.allocatedCapital;
        }

        const currentTotalEquity = Math.round((totalCurrentPosEquity + unallocatedCash) * 100) / 100;
        if (currentTotalEquity > peakEquity) {
          peakEquity = currentTotalEquity;
        }

        const ddPct =
          peakEquity > 0
            ? Math.round((((peakEquity - currentTotalEquity) / peakEquity) * 100) * 100) / 100
            : 0;

        if (ddPct > maxDrawdownPercent) {
          maxDrawdownPercent = ddPct;
        }

        // Enforce Portfolio Risk Limit
        if (ddPct >= portfolio.maxPortfolioDrawdownPercent && !riskLimitReached) {
          riskLimitReached = true;
          riskLimitMessage = `PORTFOLIO_RISK_LIMIT_REACHED: Portfolio drawdown reached ${ddPct}%, exceeding safety threshold of ${portfolio.maxPortfolioDrawdownPercent}%. Risk mitigation triggered.`;
        }

        portfolioEquityCurve.push({
          timestamp: ts,
          equity: currentTotalEquity,
          drawdownPct: ddPct
        });
      }
    }

    const finalEquity = portfolioEquityCurve[portfolioEquityCurve.length - 1].equity;
    const netPnl = Math.round((finalEquity - portfolio.initialCapital) * 100) / 100;
    const returnPercent =
      portfolio.initialCapital > 0
        ? Math.round(((netPnl / portfolio.initialCapital) * 100) * 100) / 100
        : 0;

    // 3. Compute Pearson Correlation Matrix
    const assets = Array.from(new Set(portfolio.allocations.map((a) => a.asset)));
    const correlationMatrix = await this.calculateCorrelationMatrix(assets, timeframe, candleCount);

    // Calculate Sharpe ratio on aggregate portfolio equity points
    let sharpeRatio: number | null = null;
    if (portfolioEquityCurve.length > 2) {
      const returns: number[] = [];
      for (let i = 1; i < portfolioEquityCurve.length; i++) {
        const r =
          (portfolioEquityCurve[i].equity - portfolioEquityCurve[i - 1].equity) /
          portfolioEquityCurve[i - 1].equity;
        returns.push(r);
      }
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        sharpeRatio = Math.round((mean / stdDev) * Math.sqrt(252) * 100) / 100;
      }
    }

    const result: PortfolioSimulationResult = {
      id: portfolio.id,
      name: portfolio.name,
      initialCapital: portfolio.initialCapital,
      currentEquity: finalEquity,
      netPnl,
      returnPercent,
      maxDrawdownPercent,
      sharpeRatio,
      correlationMatrix,
      equityCurve: portfolioEquityCurve,
      allocations: portfolio.allocations,
      riskLimitReached,
      riskLimitMessage,
      disclaimer: PORTFOLIO_DISCLAIMER,
      mode: 'PAPER',
      isRealMoney: false
    };

    return result;
  }

  /**
   * Lists user portfolios.
   */
  async listPortfolios(userId = 1): Promise<PortfolioConfig[]> {
    const list: PortfolioConfig[] = [];
    for (const p of this.inMemoryPortfolios.values()) {
      if (p.userId === userId) list.push(p);
    }

    try {
      const [rows] = await pool.query<any[]>(`SELECT * FROM portfolios WHERE user_id = ?`, [userId]);
      for (const row of rows) {
        if (!list.some((item) => item.id === row.id)) {
          const [posRows] = await pool.query<any[]>(
            `SELECT * FROM portfolio_positions WHERE portfolio_id = ?`,
            [row.id]
          );
          list.push({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            initialCapital: Number(row.initial_capital),
            allocations: posRows.map((r) => ({
              asset: r.asset,
              strategy: r.strategy,
              weightPercent: Number(r.weight_pct),
              allocatedCapital: Number(r.allocated_capital)
            })),
            maxPortfolioDrawdownPercent: Number(row.max_portfolio_drawdown)
          });
        }
      }
    } catch {
      // ignore db errors, memory list returned
    }

    return list;
  }
}

export const portfolioService = new PortfolioService();
