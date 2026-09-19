import { randomUUID } from 'crypto';
import { pool } from '../../config/database';
import {
  StressTestReport,
  StressTestScenario
} from '../../models/Research';
import { backtestingService } from '../backtesting.service';
import { StrategyParameters } from '../strategy.service';

const STRESS_TEST_DISCLAIMER =
  'Stress testing evaluates simulated paper trading outcomes under adverse transaction costs and execution friction. It does not predict future real-market slippage or broker conditions.';

export class StressTestService {
  /**
   * Evaluates strategy resilience against escalating fees, slippages, and risk sizing.
   */
  async runStressTest(
    strategy: string,
    asset = 'BTC/USD',
    timeframe = '5m',
    parameters?: StrategyParameters,
    candleCount = 100,
    userId = 1
  ): Promise<StressTestReport> {
    const baseFee = 0.50;
    const baseSlippage = 0.0001;

    // 1. Run Baseline
    const baseline = await backtestingService.runBacktest({
      asset,
      timeframe,
      strategy,
      parameters,
      candleCount,
      fee: baseFee,
      slippage: baseSlippage,
      riskPercent: 1.0
    });

    const baselinePnl = baseline.netPnl;
    const scenarios: StressTestScenario[] = [];

    // 2. Cost Multiplier sweeps: 1.0x, 1.5x, 2.0x, 3.0x
    const costMultipliers = [1.0, 1.5, 2.0, 3.0];
    let costSensitivityDetected = false;

    for (const mult of costMultipliers) {
      const sim = await backtestingService.runBacktest({
        asset,
        timeframe,
        strategy,
        parameters,
        candleCount,
        fee: baseFee * mult,
        slippage: baseSlippage * mult,
        riskPercent: 1.0
      });

      const isSensitive =
        mult > 1.0 && (sim.netPnl < 0 || (baselinePnl > 0 && sim.netPnl <= baselinePnl * 0.4));

      if (isSensitive) {
        costSensitivityDetected = true;
      }

      scenarios.push({
        costMultiplier: mult,
        slippagePips: Math.round(mult * 10) / 10,
        riskPercent: 1.0,
        netPnl: sim.netPnl,
        winRate: sim.winRate,
        profitFactor: sim.profitFactor,
        maxDrawdownPercent: sim.maxDrawdown,
        costSensitivityDetected: isSensitive
      });
    }

    // 3. Risk Sizing sweeps: 0.5%, 2.0%, 3.0%
    const riskLevels = [0.5, 2.0, 3.0];
    for (const risk of riskLevels) {
      const sim = await backtestingService.runBacktest({
        asset,
        timeframe,
        strategy,
        parameters,
        candleCount,
        fee: baseFee,
        slippage: baseSlippage,
        riskPercent: risk
      });

      scenarios.push({
        costMultiplier: 1.0,
        slippagePips: 1.0,
        riskPercent: risk,
        netPnl: sim.netPnl,
        winRate: sim.winRate,
        profitFactor: sim.profitFactor,
        maxDrawdownPercent: sim.maxDrawdown,
        costSensitivityDetected: false
      });
    }

    const warning = costSensitivityDetected
      ? '⚠ Cost Sensitivity Detected: Strategy performance degrades significantly under 1.5x - 2.0x simulated execution costs.'
      : undefined;

    const report: StressTestReport = {
      strategy,
      baselinePnl,
      scenarios,
      costSensitivityDetected,
      warning,
      disclaimer: STRESS_TEST_DISCLAIMER,
      mode: 'PAPER',
      isRealMoney: false
    };

    // Persist to robustness_runs
    try {
      await pool.query(
        `INSERT INTO robustness_runs (id, user_id, strategy, run_type, summary_json, details_json, passed)
         VALUES (?, ?, ?, 'STRESS_TEST', ?, ?, ?)`,
        [
          `rr_${randomUUID().replace(/-/g, '').substring(0, 16)}`,
          userId,
          strategy,
          JSON.stringify({ baselinePnl, costSensitivityDetected, scenariosCount: scenarios.length }),
          JSON.stringify(report),
          !costSensitivityDetected
        ]
      );
    } catch (err: any) {
      console.warn(`[StressTestService] DB persist warning: ${err.message}`);
    }

    return report;
  }
}

export const stressTestService = new StressTestService();
