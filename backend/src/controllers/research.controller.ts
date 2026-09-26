import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { backtestingService } from '../services/backtesting.service';
import { optimizationService } from '../services/research/optimization.service';
import { walkForwardService } from '../services/research/walkForward.service';
import { monteCarloService } from '../services/research/monteCarlo.service';
import { regimeService } from '../services/research/regime.service';
import { positionSizingService } from '../services/research/positionSizing.service';
import { robustnessService } from '../services/research/robustness.service';
import { marketService } from '../services/market.service';
import { datasetService } from '../services/research/dataset.service';
import { multiTimeframeService } from '../services/research/multiTimeframe.service';
import { stressTestService } from '../services/research/stressTest.service';
import { portfolioService } from '../services/research/portfolio.service';
import { experimentService } from '../services/research/experiment.service';
import { reportingService } from '../services/research/reporting.service';
import { pool } from '../config/database';

const SAFETY_METADATA = {
  mode: 'PAPER' as const,
  isRealMoney: false as const,
  brokerConnected: false as const,
  historical: true as const,
  isPrediction: false as const
};

/**
 * Enhanced Backtest with advanced risk metrics, regime breakdown, and monthly performance.
 */
export async function runResearchBacktest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      asset,
      timeframe = '5m',
      strategy,
      candles,
      initialBalance = 10000,
      tradeAmount = 100,
      parameters,
      spread,
      slippage,
      fee
    } = req.body;

    if (!asset || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: asset and strategy are required.'
      });
    }

    const result = await backtestingService.runBacktest({
      userId,
      asset,
      timeframe,
      strategy,
      candles,
      initialBalance: parseFloat(initialBalance),
      tradeAmount: parseFloat(tradeAmount),
      parameters,
      spread: spread !== undefined ? parseFloat(spread) : undefined,
      slippage: slippage !== undefined ? parseFloat(slippage) : undefined,
      fee: fee !== undefined ? parseFloat(fee) : undefined
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Research backtest execution failed.'
    });
  }
}

/**
 * Grid-Search Parameter Optimization with Train / Validation / Test split.
 */
export async function runOptimization(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      asset,
      timeframe = '5m',
      strategy,
      parameterRanges = {},
      trainSplitRatio = 0.70,
      valSplitRatio = 0.15,
      testSplitRatio = 0.15,
      initialBalance = 10000,
      tradeAmount = 100
    } = req.body;

    if (!asset || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'Asset and strategy parameters are required.'
      });
    }

    const result = await optimizationService.runOptimization({
      userId,
      asset,
      timeframe,
      strategy,
      parameterRanges,
      trainSplitRatio: parseFloat(trainSplitRatio),
      valSplitRatio: parseFloat(valSplitRatio),
      testSplitRatio: parseFloat(testSplitRatio),
      initialBalance: parseFloat(initialBalance),
      tradeAmount: parseFloat(tradeAmount)
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Optimization execution failed.'
    });
  }
}

/**
 * Retrieve stored optimization run by ID.
 */
export async function getOptimizationRun(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const [runs]: any = await pool.query('SELECT * FROM optimization_runs WHERE id = ?', [id]);
    if (!runs || runs.length === 0) {
      return res.status(404).json({ success: false, error: 'Optimization run not found' });
    }

    const [results]: any = await pool.query(
      'SELECT * FROM optimization_results WHERE run_id = ? ORDER BY total_pnl DESC',
      [id]
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      run: runs[0],
      results
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Walk-Forward Analysis over rolling windows.
 */
export async function runWalkForward(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      asset,
      timeframe = '5m',
      strategy,
      parameterRanges = {},
      trainCandles = 50,
      testCandles = 20,
      stepCandles = 20,
      initialBalance = 10000,
      tradeAmount = 100,
      walkForwardMethod,
      minWindowsRequired
    } = req.body;

    if (!asset || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'Asset and strategy are required for walk-forward analysis.'
      });
    }

    const result = await walkForwardService.runWalkForward({
      userId,
      asset,
      timeframe,
      strategy,
      parameterRanges,
      trainCandles: parseInt(trainCandles, 10),
      testCandles: parseInt(testCandles, 10),
      stepCandles: parseInt(stepCandles, 10),
      initialBalance: parseFloat(initialBalance),
      tradeAmount: parseFloat(tradeAmount),
      walkForwardMethod,
      minWindowsRequired: minWindowsRequired !== undefined ? parseInt(minWindowsRequired, 10) : undefined
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Walk-forward analysis failed.'
    });
  }
}

/**
 * Retrieve stored walk-forward run by ID.
 */
export async function getWalkForwardRun(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const [runs]: any = await pool.query('SELECT * FROM walk_forward_runs WHERE id = ?', [id]);
    if (!runs || runs.length === 0) {
      return res.status(404).json({ success: false, error: 'Walk-forward run not found' });
    }

    const [windows]: any = await pool.query(
      'SELECT * FROM walk_forward_results WHERE run_id = ? ORDER BY window_index ASC',
      [id]
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      run: runs[0],
      windows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Dedicated Out-Of-Sample (OOS) Test.
 */
export async function runOosTest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      asset,
      timeframe = '5m',
      strategy,
      parameters,
      splitRatio = 0.70,
      initialBalance = 10000,
      tradeAmount = 100
    } = req.body;

    if (!asset || !strategy) {
      return res.status(400).json({ success: false, error: 'Asset and strategy are required.' });
    }

    let candles = await marketService.getCandles(asset, timeframe, 150);
    candles = backtestingService.validateAndCleanCandles(candles);

    const splitIdx = Math.floor(candles.length * parseFloat(splitRatio));
    const inSampleCandles = candles.slice(0, splitIdx);
    const outSampleCandles = candles.slice(splitIdx);

    const isResult = await backtestingService.runBacktest({
      userId,
      asset,
      timeframe,
      strategy,
      candles: inSampleCandles,
      initialBalance: parseFloat(initialBalance),
      tradeAmount: parseFloat(tradeAmount),
      parameters
    }, false);

    const oosResult = await backtestingService.runBacktest({
      userId,
      asset,
      timeframe,
      strategy,
      candles: outSampleCandles,
      initialBalance: parseFloat(initialBalance),
      tradeAmount: parseFloat(tradeAmount),
      parameters
    }, false);

    const degradation =
      isResult.totalPnlPercent !== 0
        ? ((oosResult.totalPnlPercent - isResult.totalPnlPercent) / Math.abs(isResult.totalPnlPercent)) * 100
        : 0;

    res.json({
      success: true,
      ...SAFETY_METADATA,
      inSample: isResult,
      outOfSample: oosResult,
      degradationPercent: Number(degradation.toFixed(2)),
      disclaimer:
        'Out-of-sample testing measures performance on unseen historical data. It does not predict future market outcomes.'
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'OOS test failed.' });
  }
}

/**
 * Monte Carlo Trade-Sequence Resampling.
 */
export async function runMonteCarlo(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { trades, iterations = 500, initialBalance = 10000, strategy, seed } = req.body;

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty list of historical trades is required for Monte Carlo simulation.'
      });
    }

    const result = await monteCarloService.runSimulation(
      {
        trades,
        iterations: parseInt(iterations, 10),
        initialBalance: parseFloat(initialBalance),
        seed: seed !== undefined ? parseInt(seed, 10) : undefined
      },
      userId,
      strategy
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Monte Carlo simulation failed.' });
  }
}

/**
 * Advanced Multi-Strategy Comparison.
 */
export async function compareResearchStrategies(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { asset, timeframe = '5m', count = 120, initialBalance = 10000 } = req.query as any;

    if (!asset) {
      return res.status(400).json({ success: false, error: 'Asset query parameter is required.' });
    }

    const strategies = ['EMA_RSI', 'MACD', 'BOLLINGER_BANDS', 'MULTI_INDICATOR'];
    const comparisons: any[] = [];

    for (const strat of strategies) {
      try {
        const bResult = await backtestingService.runBacktest({
          userId,
          asset,
          timeframe,
          strategy: strat,
          initialBalance: parseFloat(initialBalance)
        }, false);

        comparisons.push({
          strategy: strat,
          initialBalance: bResult.initialBalance,
          finalBalance: bResult.finalBalance,
          totalPnl: bResult.totalPnl,
          totalPnlPercent: bResult.totalPnlPercent,
          totalTrades: bResult.totalTrades,
          winRate: bResult.winRate,
          profitFactor: bResult.profitFactor,
          maxDrawdown: bResult.maxDrawdown,
          sharpeRatio: bResult.advancedMetrics?.sharpeRatio ?? null,
          sortinoRatio: bResult.advancedMetrics?.sortinoRatio ?? null,
          calmarRatio: bResult.advancedMetrics?.calmarRatio ?? null,
          sampleSizeRating: bResult.advancedMetrics?.sampleSizeRating ?? 'ADEQUATE',
          sampleSizeWarning: bResult.advancedMetrics?.sampleSizeWarning
        });
      } catch (e: any) {
        console.error(`Comparison error for ${strat}:`, e.message);
      }
    }

    res.json({
      success: true,
      ...SAFETY_METADATA,
      asset,
      timeframe,
      comparisons,
      disclaimer: 'Comparative metrics are simulated paper trades across historical data. No strategy guarantees profit.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Market Regime classification across historical candles.
 */
export async function getMarketRegimes(req: AuthRequest, res: Response) {
  try {
    const { asset = 'EUR/USD', timeframe = '5m', count = '100' } = req.query as any;
    let candles = await marketService.getCandles(asset, timeframe, parseInt(count, 10));
    candles = backtestingService.validateAndCleanCandles(candles);

    const regimes = [];
    for (let i = 20; i < candles.length; i++) {
      regimes.push(regimeService.classifyRegime(candles, i));
    }

    res.json({
      success: true,
      ...SAFETY_METADATA,
      asset,
      timeframe,
      totalCandles: candles.length,
      currentRegime: regimes[regimes.length - 1],
      history: regimes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Supported Risk Profiles.
 */
export async function getRiskProfiles(req: AuthRequest, res: Response) {
  try {
    const profiles = positionSizingService.getRiskProfiles();
    res.json({
      success: true,
      ...SAFETY_METADATA,
      profiles
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Calculate Position Sizing for paper trading.
 */
export async function calculatePositionSize(req: AuthRequest, res: Response) {
  try {
    const { profile = 'BALANCED', accountBalance = 10000, entryPrice, stopLossPrice } = req.body;

    if (!entryPrice || !stopLossPrice) {
      return res.status(400).json({
        success: false,
        error: 'entryPrice and stopLossPrice are required.'
      });
    }

    const calculation = positionSizingService.calculatePositionSize(
      profile,
      parseFloat(accountBalance),
      parseFloat(entryPrice),
      parseFloat(stopLossPrice)
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      calculation
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: DATASET MANAGEMENT & VALIDATION
// ==========================================

export async function uploadDataset(req: AuthRequest, res: Response) {
  try {
    const { name, asset, timeframe = '5m', candles = [] } = req.body;
    if (!name || !asset) {
      return res.status(400).json({ success: false, error: 'name and asset are required.' });
    }

    const result = await datasetService.registerDataset(name, asset, timeframe, candles);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      metadata: result.metadata,
      validationReport: result.validationReport
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listDatasets(req: AuthRequest, res: Response) {
  try {
    const { asset, timeframe } = req.query as { asset?: string; timeframe?: string };
    const datasets = await datasetService.listDatasets(asset, timeframe);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      datasets
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDatasetById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const dataset = await datasetService.getDataset(id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found.' });
    }
    res.json({
      success: true,
      ...SAFETY_METADATA,
      dataset
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: MULTI-ASSET & TIMEFRAME VALIDATION
// ==========================================

export async function runCrossAssetValidation(req: AuthRequest, res: Response) {
  try {
    const { strategy, assets = ['BTC/USD', 'ETH/USD', 'EUR/USD'], timeframe = '5m', parameters, candleCount = 100 } = req.body;
    if (!strategy) {
      return res.status(400).json({ success: false, error: 'strategy is required.' });
    }

    const result = await multiTimeframeService.runCrossAssetValidation(
      strategy,
      assets,
      timeframe,
      parameters,
      parseInt(candleCount)
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function runCrossTimeframeValidation(req: AuthRequest, res: Response) {
  try {
    const { strategy, asset = 'BTC/USD', timeframes = ['1m', '5m', '15m', '1h'], parameters, candleCount = 100 } = req.body;
    if (!strategy) {
      return res.status(400).json({ success: false, error: 'strategy is required.' });
    }

    const result = await multiTimeframeService.runCrossTimeframeValidation(
      strategy,
      asset,
      timeframes,
      parameters,
      parseInt(candleCount)
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: PARAMETER SENSITIVITY & HEATMAP
// ==========================================

export async function runSensitivityHeatmap(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      strategy,
      asset = 'BTC/USD',
      timeframe = '5m',
      param1Name,
      param1Range,
      param2Name,
      param2Range,
      baseParameters,
      candleCount = 100
    } = req.body;

    if (!strategy || !param1Name || !param1Range || !param2Name || !param2Range) {
      return res.status(400).json({
        success: false,
        error: 'strategy, param1Name, param1Range, param2Name, and param2Range are required.'
      });
    }

    const result = await optimizationService.generateSensitivityHeatmap({
      userId,
      strategy,
      asset,
      timeframe,
      param1Name,
      param1Range,
      param2Name,
      param2Range,
      baseParameters,
      candleCount: parseInt(candleCount)
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: STRESS TESTING
// ==========================================

export async function runStressTest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { strategy, asset = 'BTC/USD', timeframe = '5m', parameters, candleCount = 100 } = req.body;
    if (!strategy) {
      return res.status(400).json({ success: false, error: 'strategy is required.' });
    }

    const report = await stressTestService.runStressTest(
      strategy,
      asset,
      timeframe,
      parameters,
      parseInt(candleCount),
      userId
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      report
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: PORTFOLIO PAPER SIMULATION
// ==========================================

export async function createPortfolio(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, initialCapital, allocations, maxPortfolioDrawdownPercent } = req.body;
    if (!name || !initialCapital || !allocations) {
      return res.status(400).json({ success: false, error: 'name, initialCapital, and allocations are required.' });
    }

    const portfolio = await portfolioService.createPortfolio({
      userId,
      name,
      initialCapital: parseFloat(initialCapital),
      allocations,
      maxPortfolioDrawdownPercent: maxPortfolioDrawdownPercent ? parseFloat(maxPortfolioDrawdownPercent) : undefined
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      portfolio
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listPortfolios(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const portfolios = await portfolioService.listPortfolios(userId);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      portfolios
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function simulatePortfolio(req: AuthRequest, res: Response) {
  try {
    const { portfolioId } = req.params;
    const { timeframe = '5m', candleCount } = req.query as { timeframe?: string; candleCount?: string };
    const count = candleCount ? parseInt(candleCount, 10) : 100;

    const simulation = await portfolioService.simulatePortfolio(
      portfolioId,
      timeframe,
      count
    );

    res.json({
      success: true,
      ...SAFETY_METADATA,
      simulation
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: PAPER EXPERIMENTS & JOURNAL
// ==========================================

export async function createExperiment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, strategy, asset = 'BTC/USD', timeframe = '5m', parameters, startBalance = 10000 } = req.body;
    if (!name || !strategy) {
      return res.status(400).json({ success: false, error: 'name and strategy are required.' });
    }

    const experiment = await experimentService.createExperiment({
      userId,
      name,
      strategy,
      asset,
      timeframe,
      parameters,
      startBalance: parseFloat(startBalance)
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      experiment
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listExperiments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const experiments = await experimentService.listExperiments(userId);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      experiments
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateExperimentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required.' });
    }

    const experiment = await experimentService.updateStatus(id, status);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      experiment
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function logExperimentTrade(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { direction, entryPrice, exitPrice, amount, slippage, fees, journalNotes, entryTime, exitTime } = req.body;

    if (!direction || !entryPrice || !exitPrice || !amount) {
      return res.status(400).json({ success: false, error: 'direction, entryPrice, exitPrice, and amount are required.' });
    }

    const trade = await experimentService.logTrade({
      experimentId: id,
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      amount: parseFloat(amount),
      slippage: slippage ? parseFloat(slippage) : undefined,
      fees: fees ? parseFloat(fees) : undefined,
      journalNotes,
      entryTime,
      exitTime
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      trade
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function compareExperiment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const comparison = await experimentService.compareBacktestVsPaper(id);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      comparison
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getExperimentTimeline(req: any, res: Response) {
  try {
    const { id } = req.params;
    const { experimentTimelineService } = await import('../services/research/experimentTimeline.service');
    const timeline = await experimentTimelineService.getTimeline(id);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      experimentId: id,
      timeline,
      totalEvents: timeline.length
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 5: RESEARCH REPORTS & EXPORTS
// ==========================================

export async function generateResearchReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { strategy, asset = 'BTC/USD', timeframe = '5m', candleCount = 100 } = req.body;
    if (!strategy) {
      return res.status(400).json({ success: false, error: 'strategy is required.' });
    }

    const report = await reportingService.generateComprehensiveReport({
      strategy,
      asset,
      timeframe,
      candleCount: parseInt(candleCount),
      userId
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      report
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function exportDataCsv(req: AuthRequest, res: Response) {
  try {
    const { rows = [], filename = 'tradepilot_research_export.csv' } = req.body;
    const csvContent = reportingService.exportToCsv(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// PHASE 8: ADVANCED RESEARCH LAB & CONTROL
// ==========================================

export async function listResearchStrategies(req: AuthRequest, res: Response) {
  try {
    const { strategyEngine } = await import('../services/strategy.service');
    const { experimentLabService } = await import('../services/research/experimentLab.service');
    const strats = strategyEngine.getAllStrategies();

    const result = strats.map(s => {
      const configHash = experimentLabService.generateConfigHash({
        strategyId: s.id,
        parameters: s.defaultParameters
      });
      return {
        strategyId: s.id,
        name: s.name,
        version: '1.0.0',
        description: s.description,
        enabled: true,
        parameters: s.defaultParameters,
        parameterDefinitions: s.parameterDefinitions,
        configHash,
        indicatorDependencies: s.id === 'EMA_RSI' ? ['EMA', 'RSI'] : s.id === 'MACD' ? ['MACD'] : s.id === 'BOLLINGER_BANDS' ? ['BollingerBands'] : ['EMA', 'RSI', 'MACD'],
        riskConfiguration: { riskPerTrade: 0.01, maxDailyLossPct: 0.05 },
        mode: 'PAPER'
      };
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      strategies: result,
      total: result.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getResearchStrategy(req: AuthRequest, res: Response) {
  try {
    const { strategyEngine } = await import('../services/strategy.service');
    const { experimentLabService } = await import('../services/research/experimentLab.service');
    const s = strategyEngine.getStrategy(req.params.id);
    const configHash = experimentLabService.generateConfigHash({
      strategyId: s.id,
      parameters: s.defaultParameters
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      strategy: {
        strategyId: s.id,
        name: s.name,
        version: '1.0.0',
        description: s.description,
        enabled: true,
        parameters: s.defaultParameters,
        parameterDefinitions: s.parameterDefinitions,
        configHash,
        indicatorDependencies: ['EMA', 'RSI'],
        riskConfiguration: { riskPerTrade: 0.01, maxDailyLossPct: 0.05 }
      }
    });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

export async function getEnsemble(req: AuthRequest, res: Response) {
  try {
    const { strategyEnsembleService } = await import('../services/research/strategyEnsemble.service');
    const config = await strategyEnsembleService.getEnsembleConfig();
    const conflicts = await strategyEnsembleService.getConflicts();
    res.json({
      success: true,
      ...SAFETY_METADATA,
      ensemble: config,
      recentConflicts: conflicts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createOrUpdateEnsemble(req: AuthRequest, res: Response) {
  try {
    const { strategyEnsembleService } = await import('../services/research/strategyEnsemble.service');
    const saved = await strategyEnsembleService.saveEnsembleConfig(req.body);
    res.status(201).json({
      success: true,
      ...SAFETY_METADATA,
      ensemble: saved
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getStrategyCorrelation(req: AuthRequest, res: Response) {
  try {
    const { strategyCorrelationService } = await import('../services/research/strategyCorrelation.service');
    const asset = (req.query.asset as string) || 'BTC/USD';
    const timeframe = (req.query.timeframe as string) || '5m';
    const correlationMatrix = await strategyCorrelationService.calculateStrategyCorrelationMatrix({
      asset,
      timeframe
    });
    const regimeCorrelations = strategyCorrelationService.calculateRegimeCorrelations();

    res.json({
      success: true,
      ...SAFETY_METADATA,
      correlationMatrix,
      regimeCorrelations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getRiskAttribution(req: AuthRequest, res: Response) {
  try {
    const { riskAttributionService } = await import('../services/research/riskAttribution.service');
    const defaultAllocations = [
      { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.40, targetCapital: 4000 },
      { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.35, targetCapital: 3500 },
      { strategyId: 'BOLLINGER_BANDS', asset: 'BTC/USD', allocationPct: 0.25, targetCapital: 2500 }
    ];
    const allocations = req.body?.allocations || defaultAllocations;
    const attribution = riskAttributionService.calculateRiskAttribution({ allocations });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      attribution
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getParameterStability(req: AuthRequest, res: Response) {
  try {
    const { parameterStabilityService } = await import('../services/research/parameterStability.service');
    const strategyId = (req.query.strategyId as string) || 'EMA_RSI';
    const parameterKey = (req.query.parameterKey as string) || 'emaPeriod';
    const baselineValue = req.query.baselineValue ? parseInt(req.query.baselineValue as string, 10) : 21;

    const stability = await parameterStabilityService.analyzeParameterStability({
      strategyId,
      parameterKey,
      baselineValue
    });

    res.json({
      success: true,
      ...SAFETY_METADATA,
      stability
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function cloneExperiment(req: AuthRequest, res: Response) {
  try {
    const { experimentLabService } = await import('../services/research/experimentLab.service');
    const cloned = await experimentLabService.cloneExperiment(req.params.id, req.body?.name);
    res.status(201).json({
      success: true,
      ...SAFETY_METADATA,
      clone: cloned
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function addExperimentTags(req: AuthRequest, res: Response) {
  try {
    const { experimentLabService } = await import('../services/research/experimentLab.service');
    const { tag, notes } = req.body;
    const tagged = await experimentLabService.addExperimentTag(req.params.id, tag || 'BASELINE', notes);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      tagged
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getReplay(req: AuthRequest, res: Response) {
  try {
    const { paperReplayService } = await import('../services/research/paperReplay.service');
    const action = (req.query.action as string) || 'init';
    const speed = req.query.speed ? (parseInt(req.query.speed as string, 10) as any) : 1;

    let state;
    if (action === 'init') {
      state = await paperReplayService.initReplay({
        experimentId: req.params.id,
        speed
      });
    } else if (action === 'step') {
      state = paperReplayService.stepNext(req.query.sessionId as string);
    } else if (action === 'prev') {
      state = paperReplayService.stepPrevious(req.query.sessionId as string);
    } else if (action === 'play') {
      state = paperReplayService.play(req.query.sessionId as string, speed);
    } else if (action === 'pause') {
      state = paperReplayService.pause(req.query.sessionId as string);
    } else if (action === 'reset') {
      state = paperReplayService.reset(req.query.sessionId as string);
    } else {
      state = paperReplayService.getState(req.query.sessionId as string);
    }

    res.json({
      success: true,
      ...SAFETY_METADATA,
      replay: state
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getTradeDiagnostics(req: AuthRequest, res: Response) {
  try {
    const { tradeDiagnosticsService } = await import('../services/research/tradeDiagnostics.service');
    const diagnostic = await tradeDiagnosticsService.getTradeDiagnostic(req.params.tradeId);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      diagnostic
    });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

export async function getPerformanceStages(req: AuthRequest, res: Response) {
  try {
    const { paperResearchComparisonService } = await import('../services/research/paperResearchComparison.service');
    const comparison = await paperResearchComparisonService.getPerformanceStagesComparison(req.params.id);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      comparison
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// ==========================================
// PHASE 9: AUTONOMOUS RESEARCH ORCHESTRATOR
// ==========================================

export async function submitResearchJob(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.createJob(req.body);
    res.json({ success: true, ...SAFETY_METADATA, job });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listResearchJobs(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const jobs = await researchOrchestratorService.listJobs(req.query.status as any);
    res.json({ success: true, ...SAFETY_METADATA, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getResearchJobStatus(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, ...SAFETY_METADATA, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function pauseResearchJob(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.pauseJob(req.params.id);
    res.json({ success: true, ...SAFETY_METADATA, job });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function resumeResearchJob(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.resumeJob(req.params.id);
    res.json({ success: true, ...SAFETY_METADATA, job });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function cancelResearchJob(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.cancelJob(req.params.id, req.body.reason);
    res.json({ success: true, ...SAFETY_METADATA, job });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function executeNextResearchJob(req: AuthRequest, res: Response) {
  try {
    const { researchOrchestratorService } = await import('../services/research/researchOrchestrator.service');
    const job = await researchOrchestratorService.createJob({
      type: 'FULL_RESEARCH_PIPELINE',
      parameters: {
        strategy: req.body.strategyId || 'EMA_RSI',
        asset: req.body.asset || 'BTC/USD',
        timeframe: req.body.timeframe || '5m'
      }
    });
    const result = await researchOrchestratorService.runFullPipeline(job);
    res.json({ success: true, ...SAFETY_METADATA, pipelineResult: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Schedules
export async function createResearchSchedule(req: AuthRequest, res: Response) {
  try {
    const { researchSchedulerService } = await import('../services/research/researchScheduler.service');
    const schedule = await researchSchedulerService.createSchedule(req.body);
    res.json({ success: true, ...SAFETY_METADATA, schedule });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listResearchSchedules(req: AuthRequest, res: Response) {
  try {
    const { researchSchedulerService } = await import('../services/research/researchScheduler.service');
    const schedules = await researchSchedulerService.listSchedules();
    res.json({ success: true, ...SAFETY_METADATA, schedules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function toggleResearchSchedule(req: AuthRequest, res: Response) {
  try {
    const { researchSchedulerService } = await import('../services/research/researchScheduler.service');
    const success = await researchSchedulerService.updateScheduleStatus(req.params.id, Boolean(req.body.enabled));
    res.json({ success, ...SAFETY_METADATA });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Drift Trends
export async function getDriftTrends(req: AuthRequest, res: Response) {
  try {
    const { driftTrendService } = await import('../services/research/driftTrend.service');
    const analysis = driftTrendService.analyzeDriftTrend({
      strategyId: req.params.strategyId,
      asset: req.query.asset as string || 'BTC/USD',
      trades: req.body.trades || [{ pnl: 50 }, { pnl: -20 }, { pnl: 40 }, { pnl: 60 }, { pnl: 30 }, { pnl: -10 }, { pnl: 45 }]
    });
    res.json({ success: true, ...SAFETY_METADATA, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Research Recommendations
export async function getResearchRecommendations(req: AuthRequest, res: Response) {
  try {
    const { researchRecommendationService } = await import('../services/research/researchRecommendation.service');
    const recommendations = await researchRecommendationService.listRecommendations(req.query.status as any);
    res.json({ success: true, ...SAFETY_METADATA, recommendations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateRecommendationsForStrategy(req: AuthRequest, res: Response) {
  try {
    const { researchRecommendationService } = await import('../services/research/researchRecommendation.service');
    const rec = await researchRecommendationService.evaluateTrigger({
      trigger: req.body.trigger || 'SIGNIFICANT_DRIFT',
      reason: req.body.reason || `Automated research trigger evaluated for ${req.params.strategyId}`,
      evidence: req.body.evidence || 'Observed rolling window drift degradation',
      suggestedJob: req.body.suggestedJob || 'WALK_FORWARD',
      parameters: { strategy: req.params.strategyId }
    });
    res.json({ success: true, ...SAFETY_METADATA, generatedCount: 1, recommendations: [rec] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function dismissRecommendation(req: AuthRequest, res: Response) {
  try {
    const { researchRecommendationService } = await import('../services/research/researchRecommendation.service');
    const success = await researchRecommendationService.dismissRecommendation(req.params.id);
    res.json({ success, ...SAFETY_METADATA });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}


// Evidence Quality & Strategy Evidence Matrix
export async function getStrategyEvidenceMatrix(req: AuthRequest, res: Response) {
  try {
    const { evidenceQualityService } = await import('../services/research/evidenceQuality.service');
    const matrix = await evidenceQualityService.getEvidenceMatrix();
    res.json({ success: true, ...SAFETY_METADATA, matrix });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Experiment Diff & Lineage
export async function compareExperimentConfigs(req: AuthRequest, res: Response) {
  try {
    const { experimentDiffService } = await import('../services/research/experimentDiff.service');
    const diff = await experimentDiffService.diffExperiments(req.params.expA, req.params.expB);
    res.json({ success: true, ...SAFETY_METADATA, diff });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getExperimentLineage(req: AuthRequest, res: Response) {
  try {
    const { experimentDiffService } = await import('../services/research/experimentDiff.service');
    const lineage = await experimentDiffService.getLineageTree(req.params.id);
    res.json({ success: true, ...SAFETY_METADATA, lineage });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Paper Watchdog
export async function inspectPaperWatchdog(req: AuthRequest, res: Response) {
  try {
    const { paperExperimentWatchdogService } = await import('../services/research/paperExperimentWatchdog.service');
    const result = await paperExperimentWatchdogService.inspectExperiments();
    res.json({ success: true, ...SAFETY_METADATA, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getWatchdogEvents(req: AuthRequest, res: Response) {
  try {
    const { paperExperimentWatchdogService } = await import('../services/research/paperExperimentWatchdog.service');
    const events = await paperExperimentWatchdogService.getEvents(req.query.experimentId as string);
    res.json({ success: true, ...SAFETY_METADATA, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function resumeWatchdogStrategy(req: AuthRequest, res: Response) {
  try {
    const { paperExperimentWatchdogService } = await import('../services/research/paperExperimentWatchdog.service');
    const success = await paperExperimentWatchdogService.resumeExperiment(
      req.params.strategyId,
      req.body.justification || 'Manual controlled resumption from watchdog pause'
    );
    res.json({ success, ...SAFETY_METADATA });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Anomaly Investigations
export async function triggerAnomalyInvestigation(req: AuthRequest, res: Response) {
  try {
    const { anomalyInvestigationService } = await import('../services/research/anomalyInvestigation.service');
    const investigation = await anomalyInvestigationService.triggerInvestigation({
      anomalyId: req.body.anomalyId || `ANOM_${Date.now()}`,
      asset: req.body.asset || 'BTC/USD',
      strategyId: req.body.strategyId || 'EMA_RSI'
    });
    res.json({ success: true, ...SAFETY_METADATA, investigation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getAnomalyInvestigations(req: AuthRequest, res: Response) {
  try {
    const { anomalyInvestigationService } = await import('../services/research/anomalyInvestigation.service');
    const investigations = await anomalyInvestigationService.listInvestigations();
    res.json({ success: true, ...SAFETY_METADATA, investigations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Stress Matrix
export async function runStressMatrix(req: AuthRequest, res: Response) {
  try {
    const { stressMatrixService } = await import('../services/research/stressMatrix.service');
    const result = await stressMatrixService.computeStressMatrix({
      strategyId: req.body.strategyId || 'EMA_RSI',
      matrixType: req.body.matrixType || 'COST_X_SLIPPAGE'
    });
    res.json({ success: true, ...SAFETY_METADATA, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getLatestStressMatrix(req: AuthRequest, res: Response) {
  try {
    const { stressMatrixService } = await import('../services/research/stressMatrix.service');
    const result = await stressMatrixService.getLatestMatrix(req.params.strategyId);
    res.json({ success: true, ...SAFETY_METADATA, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Portfolio What-If
export async function runPortfolioWhatIf(req: AuthRequest, res: Response) {
  try {
    const { portfolioWhatIfService } = await import('../services/research/portfolioWhatIf.service');
    const result = await portfolioWhatIfService.simulateWhatIf({
      scenarioName: req.body.scenarioName || 'Custom Scenario',
      scenario: req.body.scenario || {}
    });
    res.json({ success: true, ...SAFETY_METADATA, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getPortfolioWhatIfRuns(req: AuthRequest, res: Response) {
  try {
    const { portfolioWhatIfService } = await import('../services/research/portfolioWhatIf.service');
    const runs = await portfolioWhatIfService.listRuns();
    res.json({ success: true, ...SAFETY_METADATA, runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Regime Transitions
export async function recordRegimeTransition(req: AuthRequest, res: Response) {
  try {
    const { regimeTransitionService } = await import('../services/research/regimeTransition.service');
    const event = await regimeTransitionService.recordTransition({
      asset: req.body.asset || 'BTC/USD',
      previousRegime: req.body.previousRegime || 'RANGING',
      newRegime: req.body.newRegime || 'TRENDING',
      confidenceScore: req.body.confidenceScore || 85.0,
      triggerIndicators: req.body.triggerIndicators || {},
      affectedStrategies: req.body.affectedStrategies || ['EMA_RSI']
    });
    res.json({ success: true, ...SAFETY_METADATA, event });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getRegimeTransitions(req: AuthRequest, res: Response) {
  try {
    const { regimeTransitionService } = await import('../services/research/regimeTransition.service');
    const events = await regimeTransitionService.getRecentTransitions(req.query.asset as string);
    res.json({ success: true, ...SAFETY_METADATA, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Automated Reports
export async function generateDailyResearchReport(req: AuthRequest, res: Response) {
  try {
    const { automatedReportService } = await import('../services/research/automatedReport.service');
    const report = await automatedReportService.generateDailyReport(req.body.reportDate);
    res.json({ success: true, ...SAFETY_METADATA, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateWeeklyResearchReport(req: AuthRequest, res: Response) {
  try {
    const { automatedReportService } = await import('../services/research/automatedReport.service');
    const report = await automatedReportService.generateWeeklyReport(req.body.weekStartDate);
    res.json({ success: true, ...SAFETY_METADATA, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function listDailyResearchReports(req: AuthRequest, res: Response) {
  try {
    const { automatedReportService } = await import('../services/research/automatedReport.service');
    const reports = await automatedReportService.getDailyReports();
    res.json({ success: true, ...SAFETY_METADATA, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function listWeeklyResearchReports(req: AuthRequest, res: Response) {
  try {
    const { automatedReportService } = await import('../services/research/automatedReport.service');
    const reports = await automatedReportService.getWeeklyReports();
    res.json({ success: true, ...SAFETY_METADATA, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// STRATEGY V2: QUALITY-FIRST ADAPTIVE ENGINE
// ==========================================

export async function evaluateStrategyV2Signal(req: AuthRequest, res: Response) {
  try {
    const { strategyV2Service } = await import('../services/strategy/strategyV2.service');
    const { derivMarketProvider } = await import('../services/market/derivMarket.provider');
    const { marketService } = await import('../services/market.service');

    let candles = req.body.candles;
    const symbol = req.body.symbol || 'R_100';

    if (!candles || candles.length === 0) {
      candles = await derivMarketProvider.getCandles(symbol, '1m', 50);
      if (!candles || candles.length < 20) {
        candles = await marketService.getCandles(symbol, '1m', 50);
      }
    }

    const result = strategyV2Service.evaluateSignal(candles, req.body.indicators, req.body.parameters);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      signalResult: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function compareStrategyV1VsV2(req: AuthRequest, res: Response) {
  try {
    const { strategyV2ComparisonService } = await import('../services/research/strategyV2Comparison.service');
    const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
    const symbol = req.query.symbol as string;

    const comparison = await strategyV2ComparisonService.compareV1VsV2(userId, symbol);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      comparison
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function validateStrategyV2Oos(req: AuthRequest, res: Response) {
  try {
    const { outOfSampleValidationService } = await import('../services/research/outOfSampleValidation.service');
    const { derivMarketProvider } = await import('../services/market/derivMarket.provider');
    const { marketService } = await import('../services/market.service');

    let candles = req.body.candles;
    const symbol = req.body.symbol || 'R_100';

    if (!candles || candles.length < 50) {
      candles = await derivMarketProvider.getCandles(symbol, '1m', 300);
      if (!candles || candles.length < 50) {
        candles = await marketService.getCandles(symbol, '1m', 300);
      }
    }

    const report = outOfSampleValidationService.runValidation(candles, req.body.parameters);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      report
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getStrategyV2Journal(req: AuthRequest, res: Response) {
  try {
    const { paperJournalService } = await import('../services/research/paperJournal.service');
    const entries = await paperJournalService.getJournalEntries({
      strategyVersion: req.query.strategyVersion as string,
      userId: req.user?.userId,
      symbol: req.query.symbol as string,
      regime: req.query.regime as string,
      limit: req.query.limit ? Number(req.query.limit) : 100
    });
    res.json({
      success: true,
      ...SAFETY_METADATA,
      entries,
      total: entries.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStrategyV2LossAnalysis(req: AuthRequest, res: Response) {
  try {
    const { lossAnalysisService } = await import('../services/research/lossAnalysis.service');
    const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
    const symbol = req.query.symbol as string;

    const report = await lossAnalysisService.analyzeLosses(userId, symbol);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      report
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStrategyV2LossClusters(req: AuthRequest, res: Response) {
  try {
    const { lossAnalysisService } = await import('../services/research/lossAnalysis.service');
    const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
    const symbol = req.query.symbol as string;

    const report = await lossAnalysisService.analyzeLosses(userId, symbol);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      lossClusters: report.lossClusters,
      consecutiveLossAnalysis: report.consecutiveLossAnalysis
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStrategyV2DiagnosticAlerts(req: AuthRequest, res: Response) {
  try {
    const { lossAnalysisService } = await import('../services/research/lossAnalysis.service');
    const userId = req.user?.userId || (req.query.userId ? Number(req.query.userId) : undefined);
    const symbol = req.query.symbol as string;

    const report = await lossAnalysisService.analyzeLosses(userId, symbol);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      alerts: report.diagnosticAlerts,
      total: report.diagnosticAlerts.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStrategyV2ValidationReport(req: AuthRequest, res: Response) {
  try {
    const { lossAnalysisService } = await import('../services/research/lossAnalysis.service');
    const { strategyV2ComparisonService } = await import('../services/research/strategyV2Comparison.service');
    const { outOfSampleValidationService } = await import('../services/research/outOfSampleValidation.service');
    const { derivMarketProvider } = await import('../services/market/derivMarket.provider');
    const { marketService } = await import('../services/market.service');

    const userId = req.user?.userId;
    const symbol = (req.query.symbol as string) || 'R_100';

    // 1. Loss Analysis
    const lossReport = await lossAnalysisService.analyzeLosses(userId, symbol);

    // 2. V1 vs V2 Comparison
    const comparison = await strategyV2ComparisonService.compareV1VsV2(userId, symbol);

    // 3. OOS Validation
    let candles = await derivMarketProvider.getCandles(symbol, '1m', 300);
    if (!candles || candles.length < 50) {
      candles = await marketService.getCandles(symbol, '1m', 300);
    }
    const oosReport = outOfSampleValidationService.runValidation(candles);

    res.json({
      success: true,
      ...SAFETY_METADATA,
      validationDashboard: {
        overview: {
          totalTrades: lossReport.totalTrades,
          wins: lossReport.totalWins,
          losses: lossReport.totalLosses,
          winRate: lossReport.overallWinRate,
          totalPnL: lossReport.overallPnL,
          expectancy: lossReport.overallExpectancy,
          maxDrawdown: lossReport.maxDrawdown,
          maxConsecutiveLosses: lossReport.maxConsecutiveLosses,
          sampleStatus: lossReport.totalTrades >= 30 ? 'ADEQUATE' : 'INSUFFICIENT_SAMPLE'
        },
        assetAnalysis: lossReport.assetAnalysis,
        regimeAnalysis: lossReport.regimeAnalysis,
        scoreAnalysis: lossReport.scoreAnalysis,
        confirmationAnalysis: lossReport.confirmationAnalysis,
        durationAnalysis: lossReport.durationAnalysis,
        consecutiveLossAnalysis: lossReport.consecutiveLossAnalysis,
        lossClusters: lossReport.lossClusters,
        v1VsV2Comparison: comparison,
        oosValidation: oosReport,
        diagnosticAlerts: lossReport.diagnosticAlerts,
        disclaimer: 'Strategy V2 Demo Validation & Loss Analysis Dashboard. All metrics are computed strictly for research in DEMO/PAPER mode.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function collectDemoTrades(req: AuthRequest, res: Response) {
  try {
    const { paperJournalService } = await import('../services/research/paperJournal.service');
    const count = req.body.count ? Number(req.body.count) : 120;
    const seeded = await paperJournalService.seedValidationDataset(count);
    res.json({
      success: true,
      ...SAFETY_METADATA,
      message: `Successfully collected ${seeded.length} demo validation trades in paper journal.`,
      collectedCount: seeded.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}



