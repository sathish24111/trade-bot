import { pool } from '../../config/database';
import {
  StressMatrixCell,
  StressMatrixClassification,
  StressMatrixResult,
  SAFETY_METADATA_PHASE9
} from '../../models/Phase9';
import { broadcastEvent } from '../../websocket/websocket.server';

export class StressMatrixService {
  /**
   * Generates a 2D Stress Matrix for a strategy.
   */
  async computeStressMatrix(params: {
    strategyId: string;
    matrixType?: 'COST_X_SLIPPAGE' | 'RISK_X_VOLATILITY';
    xDimensionValues?: number[];
    yDimensionValues?: number[];
  }): Promise<StressMatrixResult> {
    const {
      strategyId,
      matrixType = 'COST_X_SLIPPAGE',
      xDimensionValues = [0, 5, 10, 20, 50],
      yDimensionValues = [0, 5, 10, 20, 30]
    } = params;

    const xDimensionName = matrixType === 'COST_X_SLIPPAGE' ? 'Transaction Fee (bps)' : 'Risk Multiplier';
    const yDimensionName = matrixType === 'COST_X_SLIPPAGE' ? 'Slippage (bps)' : 'Volatility Shock (%)';

    const grid: StressMatrixCell[][] = [];
    let fragileCount = 0;
    let totalCells = 0;

    for (const y of yDimensionValues) {
      const row: StressMatrixCell[] = [];
      for (const x of xDimensionValues) {
        totalCells++;
        const costPenalty = (x + y) * 0.15;
        const returnPct = Number((18.5 - costPenalty).toFixed(2));
        const maxDrawdown = Number((6.2 + (x + y) * 0.08).toFixed(2));
        const expectancy = Number((1.2 - (x + y) * 0.02).toFixed(2));

        let status: StressMatrixClassification = 'ROBUST';
        if (returnPct < 0 || maxDrawdown > 25.0) {
          status = 'FRAGILE';
          fragileCount++;
        } else if (returnPct < 8.0 || maxDrawdown > 15.0) {
          status = 'SENSITIVE';
        }

        row.push({
          xDimensionValue: x,
          yDimensionValue: y,
          returnPct,
          maxDrawdown,
          expectancy,
          status
        });
      }
      grid.push(row);
    }

    let overallRobustness: StressMatrixClassification = 'ROBUST';
    if (fragileCount / totalCells > 0.4) {
      overallRobustness = 'FRAGILE';
    } else if (fragileCount / totalCells > 0.15) {
      overallRobustness = 'SENSITIVE';
    }

    const result: StressMatrixResult = {
      strategyId,
      matrixType,
      xDimensionName,
      yDimensionName,
      grid,
      overallRobustness,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Stress matrix simulates synthetic transaction friction and shocks. Demonstrates historical model fragility in DEMO mode.'
    };

    await pool.query(
      `INSERT INTO stress_matrix_results (strategy_id, matrix_type, grid, overall_robustness)
       VALUES (?, ?, ?, ?)`,
      [strategyId, matrixType, JSON.stringify(grid), overallRobustness]
    );

    broadcastEvent({
      type: 'STRESS_MATRIX_COMPUTED',
      strategyId,
      matrixType,
      overallRobustness,
      ...SAFETY_METADATA_PHASE9
    });

    return result;
  }

  async getLatestMatrix(strategyId: string): Promise<StressMatrixResult | null> {
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM stress_matrix_results WHERE strategy_id = ? ORDER BY created_at DESC LIMIT 1`,
      [strategyId]
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      strategyId: r.strategy_id,
      matrixType: r.matrix_type,
      xDimensionName: r.matrix_type === 'COST_X_SLIPPAGE' ? 'Transaction Fee (bps)' : 'Risk Multiplier',
      yDimensionName: r.matrix_type === 'COST_X_SLIPPAGE' ? 'Slippage (bps)' : 'Volatility Shock (%)',
      grid: typeof r.grid === 'string' ? JSON.parse(r.grid) : r.grid,
      overallRobustness: r.overall_robustness,
      generatedAt: new Date(r.created_at).toISOString(),
      disclaimer: 'Stress matrix represents descriptive fragility diagnostics in PAPER mode.'
    };
  }
}

export const stressMatrixService = new StressMatrixService();

