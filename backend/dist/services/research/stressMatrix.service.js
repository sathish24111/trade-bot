"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stressMatrixService = exports.StressMatrixService = void 0;
const database_1 = require("../../config/database");
const Phase9_1 = require("../../models/Phase9");
const websocket_server_1 = require("../../websocket/websocket.server");
class StressMatrixService {
    /**
     * Generates a 2D Stress Matrix for a strategy.
     */
    async computeStressMatrix(params) {
        const { strategyId, matrixType = 'COST_X_SLIPPAGE', xDimensionValues = [0, 5, 10, 20, 50], yDimensionValues = [0, 5, 10, 20, 30] } = params;
        const xDimensionName = matrixType === 'COST_X_SLIPPAGE' ? 'Transaction Fee (bps)' : 'Risk Multiplier';
        const yDimensionName = matrixType === 'COST_X_SLIPPAGE' ? 'Slippage (bps)' : 'Volatility Shock (%)';
        const grid = [];
        let fragileCount = 0;
        let totalCells = 0;
        for (const y of yDimensionValues) {
            const row = [];
            for (const x of xDimensionValues) {
                totalCells++;
                const costPenalty = (x + y) * 0.15;
                const returnPct = Number((18.5 - costPenalty).toFixed(2));
                const maxDrawdown = Number((6.2 + (x + y) * 0.08).toFixed(2));
                const expectancy = Number((1.2 - (x + y) * 0.02).toFixed(2));
                let status = 'ROBUST';
                if (returnPct < 0 || maxDrawdown > 25.0) {
                    status = 'FRAGILE';
                    fragileCount++;
                }
                else if (returnPct < 8.0 || maxDrawdown > 15.0) {
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
        let overallRobustness = 'ROBUST';
        if (fragileCount / totalCells > 0.4) {
            overallRobustness = 'FRAGILE';
        }
        else if (fragileCount / totalCells > 0.15) {
            overallRobustness = 'SENSITIVE';
        }
        const result = {
            strategyId,
            matrixType,
            xDimensionName,
            yDimensionName,
            grid,
            overallRobustness,
            generatedAt: new Date().toISOString(),
            disclaimer: 'Stress matrix simulates synthetic transaction friction and shocks. Demonstrates historical model fragility in DEMO mode.'
        };
        await database_1.pool.query(`INSERT INTO stress_matrix_results (strategy_id, matrix_type, grid, overall_robustness)
       VALUES (?, ?, ?, ?)`, [strategyId, matrixType, JSON.stringify(grid), overallRobustness]);
        (0, websocket_server_1.broadcastEvent)({
            type: 'STRESS_MATRIX_COMPUTED',
            strategyId,
            matrixType,
            overallRobustness,
            ...Phase9_1.SAFETY_METADATA_PHASE9
        });
        return result;
    }
    async getLatestMatrix(strategyId) {
        const [rows] = await database_1.pool.query(`SELECT * FROM stress_matrix_results WHERE strategy_id = ? ORDER BY created_at DESC LIMIT 1`, [strategyId]);
        if (rows.length === 0)
            return null;
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
exports.StressMatrixService = StressMatrixService;
exports.stressMatrixService = new StressMatrixService();
