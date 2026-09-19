import { pool } from '../../config/database';
import {
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  SAFETY_METADATA_PHASE9
} from '../../models/Phase9';
import { broadcastEvent } from '../../websocket/websocket.server';

export class PortfolioWhatIfService {
  /**
   * Evaluates counterfactual and hypothetical what-if scenarios on a paper portfolio.
   */
  async simulateWhatIf(params: {
    scenarioName: string;
    scenario: WhatIfScenarioInput;
  }): Promise<WhatIfScenarioResult> {
    const { scenarioName, scenario } = params;
    const runId = `WHATIF_${Date.now()}`;

    // Baseline paper portfolio equity & drawdown
    const baselineEquity = 10000.0;
    const baselineDrawdown = 4.2;

    let costFactor = scenario.costMultiplier || 1.0;
    let slippageFactor = scenario.slippageMultiplier || 1.0;
    let volShock = scenario.volatilityShockPct || 0.0;
    let disabledCount = scenario.disabledStrategies?.length || 0;

    // Simulate outcome based on counterfactual parameters
    const equityPenalty = (costFactor - 1.0) * 200 + (slippageFactor - 1.0) * 150 + volShock * 15;
    const simulatedEquity = Number((baselineEquity - equityPenalty + (disabledCount * 50)).toFixed(2));
    const simulatedDrawdown = Number((baselineDrawdown + (volShock * 0.1) + (slippageFactor * 0.2)).toFixed(2));

    const equityDeltaPct = Number((((simulatedEquity - baselineEquity) / baselineEquity) * 100).toFixed(2));
    const drawdownDeltaPct = Number((simulatedDrawdown - baselineDrawdown).toFixed(2));

    const riskContributions = [
      { strategyId: 'EMA_RSI', contributionPct: disabledCount > 0 ? 0 : 45.0 },
      { strategyId: 'MACD', contributionPct: 35.0 },
      { strategyId: 'BOLLINGER_BANDS', contributionPct: 20.0 }
    ];

    const result: WhatIfScenarioResult = {
      scenarioName,
      baselineEquity,
      simulatedEquity,
      baselineDrawdown,
      simulatedDrawdown,
      equityDeltaPct,
      drawdownDeltaPct,
      riskContributions,
      disclaimer: 'What-If analysis models hypothetical allocations and frictions in DEMO mode. Not an investment forecast.'
    };

    await pool.query(
      `INSERT INTO portfolio_what_if_runs 
       (id, scenario_name, inputs, baseline_equity, simulated_equity, baseline_drawdown, simulated_drawdown, risk_contributions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runId,
        scenarioName,
        JSON.stringify(scenario),
        baselineEquity,
        simulatedEquity,
        baselineDrawdown,
        simulatedDrawdown,
        JSON.stringify(riskContributions)
      ]
    );

    broadcastEvent({
      type: 'PORTFOLIO_WHAT_IF',
      runId,
      scenarioName,
      equityDeltaPct,
      ...SAFETY_METADATA_PHASE9
    });

    return result;
  }

  async listRuns(limit = 20): Promise<WhatIfScenarioResult[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM portfolio_what_if_runs ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    return rows.map(r => ({
      scenarioName: r.scenario_name,
      baselineEquity: Number(r.baseline_equity),
      simulatedEquity: Number(r.simulated_equity),
      baselineDrawdown: Number(r.baseline_drawdown),
      simulatedDrawdown: Number(r.simulated_drawdown),
      equityDeltaPct: Number((((Number(r.simulated_equity) - Number(r.baseline_equity)) / Number(r.baseline_equity)) * 100).toFixed(2)),
      drawdownDeltaPct: Number((Number(r.simulated_drawdown) - Number(r.baseline_drawdown)).toFixed(2)),
      riskContributions: typeof r.risk_contributions === 'string' ? JSON.parse(r.risk_contributions) : r.risk_contributions,
      disclaimer: 'What-If simulations are descriptive scenario projections for paper trading.'
    }));
  }
}

export const portfolioWhatIfService = new PortfolioWhatIfService();

