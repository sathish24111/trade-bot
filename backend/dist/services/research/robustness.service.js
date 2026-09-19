"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.robustnessService = exports.RobustnessService = void 0;
const ROBUSTNESS_DISCLAIMER = 'Robustness analysis evaluates empirical consistency across historical parameter spaces, regimes, and partitions. It does not select or declare a single guaranteed winner or predict future profitability.';
class RobustnessService {
    /**
     * Evaluates multi-component strategy robustness objectively without declaring a winner.
     */
    analyzeRobustness(params) {
        const { strategy, metrics, optimizationResults, regimePerformance, wfeScore } = params;
        // 1. Sample Size Assessment
        let sampleSizeRating = 'ADEQUATE';
        let sampleSizeWarning = undefined;
        if (metrics.totalTrades < 10) {
            sampleSizeRating = 'VERY_SMALL';
            sampleSizeWarning =
                'Limited sample size: Result based on few trades (<10) and should not be treated as statistically reliable.';
        }
        else if (metrics.totalTrades < 30) {
            sampleSizeRating = 'LIMITED';
            sampleSizeWarning =
                'Limited sample size (<30 trades): Interpret risk-adjusted metrics and performance with caution.';
        }
        else if (metrics.totalTrades < 100) {
            sampleSizeRating = 'MODERATE';
        }
        // 2. Parameter Stability (Surface variance)
        let parameterStabilityRating = 'MODERATE';
        if (optimizationResults && optimizationResults.length > 2) {
            const returns = optimizationResults.map(r => r.trainMetrics.returnPercent);
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
            const coeffOfVariation = Math.abs(mean) > 0 ? Math.sqrt(variance) / Math.abs(mean) : 2.0;
            if (coeffOfVariation < 0.35) {
                parameterStabilityRating = 'HIGH';
            }
            else if (coeffOfVariation > 1.0) {
                parameterStabilityRating = 'LOW';
            }
        }
        // 3. Out-of-Sample Consistency
        let oosConsistencyRatio = null;
        let overfittingRisk = 'LOW';
        if (wfeScore !== undefined) {
            oosConsistencyRatio = Number((wfeScore / 100).toFixed(2));
            if (wfeScore < 30) {
                overfittingRisk = 'HIGH';
            }
            else if (wfeScore < 60) {
                overfittingRisk = 'MODERATE';
            }
        }
        // 4. Drawdown Stability
        let drawdownStabilityRating = 'STABLE';
        if (metrics.maxDrawdownPercent > 25 || metrics.maxDrawdownDurationBars > 40) {
            drawdownStabilityRating = 'UNSTABLE';
        }
        else if (metrics.maxDrawdownPercent > 12) {
            drawdownStabilityRating = 'MODERATE';
        }
        // 5. Regime Adaptability
        let regimeAdaptabilityRating = 'ALL_REGIMES';
        if (regimePerformance && regimePerformance.length > 0) {
            const activeRegimes = regimePerformance.filter(r => r.tradesCount > 0);
            const profitableRegimes = activeRegimes.filter(r => r.netPnl > 0);
            if (activeRegimes.length > 1) {
                const ratio = profitableRegimes.length / activeRegimes.length;
                if (ratio === 1.0) {
                    regimeAdaptabilityRating = 'ALL_REGIMES';
                }
                else if (ratio >= 0.5) {
                    regimeAdaptabilityRating = 'REGIME_DEPENDENT';
                }
                else {
                    regimeAdaptabilityRating = 'VULNERABLE';
                }
            }
        }
        return {
            strategy,
            sampleSizeRating,
            sampleSizeWarning,
            parameterStabilityRating,
            oosConsistencyRatio,
            drawdownStabilityRating,
            regimeAdaptabilityRating,
            overfittingRisk,
            disclaimer: ROBUSTNESS_DISCLAIMER,
            evaluationType: 'ROBUSTNESS_ANALYSIS',
            mode: 'PAPER'
        };
    }
}
exports.RobustnessService = RobustnessService;
exports.robustnessService = new RobustnessService();
