import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  runResearchBacktest,
  runOptimization,
  getOptimizationRun,
  runWalkForward,
  getWalkForwardRun,
  runOosTest,
  runMonteCarlo,
  compareResearchStrategies,
  getMarketRegimes,
  getRiskProfiles,
  calculatePositionSize,
  uploadDataset,
  listDatasets,
  getDatasetById,
  runCrossAssetValidation,
  runCrossTimeframeValidation,
  runSensitivityHeatmap,
  runStressTest,
  createPortfolio,
  listPortfolios,
  simulatePortfolio,
  createExperiment,
  listExperiments,
  updateExperimentStatus,
  logExperimentTrade,
  compareExperiment,
  getExperimentTimeline,
  generateResearchReport,
  exportDataCsv,
  listResearchStrategies,
  getResearchStrategy,
  getEnsemble,
  createOrUpdateEnsemble,
  getStrategyCorrelation,
  getRiskAttribution,
  getParameterStability,
  cloneExperiment,
  addExperimentTags,
  getReplay,
  getTradeDiagnostics,
  getPerformanceStages,
  submitResearchJob,
  listResearchJobs,
  getResearchJobStatus,
  pauseResearchJob,
  resumeResearchJob,
  cancelResearchJob,
  executeNextResearchJob,
  createResearchSchedule,
  listResearchSchedules,
  toggleResearchSchedule,
  getDriftTrends,
  getResearchRecommendations,
  generateRecommendationsForStrategy,
  dismissRecommendation,
  getStrategyEvidenceMatrix,
  compareExperimentConfigs,
  getExperimentLineage,
  inspectPaperWatchdog,
  getWatchdogEvents,
  resumeWatchdogStrategy,
  triggerAnomalyInvestigation,
  getAnomalyInvestigations,
  runStressMatrix,
  getLatestStressMatrix,
  runPortfolioWhatIf,
  getPortfolioWhatIfRuns,
  recordRegimeTransition,
  getRegimeTransitions,
  generateDailyResearchReport,
  generateWeeklyResearchReport,
  listDailyResearchReports,
  listWeeklyResearchReports,
  evaluateStrategyV2Signal,
  compareStrategyV1VsV2,
  validateStrategyV2Oos,
  getStrategyV2Journal,
  getStrategyV2LossAnalysis,
  getStrategyV2LossClusters,
  getStrategyV2DiagnosticAlerts,
  getStrategyV2ValidationReport,
  collectDemoTrades,
  getStrategyV2_1LabDashboard,
  getStrategyV2_1ExperimentMatrix,
  getStrategyV2_1DurationExperiment,
  getStrategyV2_1RangingExperiment,
  getStrategyV2_1ThresholdExperiment,
  getStrategyV2_1OosValidation,
  evaluateStrategyV2_1Signal,
  getStrategyV2_2FreshDashboard,
  getStrategyV2_2ExperimentMatrix,
  getStrategyV2_2Breakdowns,
  getStrategyV2_2ConfidenceIntervals,
  getStrategyV2_2OosValidation,
  collectFreshDatasetV2_2,
  getStrategyV2_3MultiSessionDashboard,
  getStrategyV2_3SessionsList,
  getStrategyV2_3HypothesesSummary,
  getStrategyV2_3CrossAsset,
  getStrategyV2_3CrossRegime,
  getStrategyV2_3OosValidation,
  getStrategyV2_3PromotionGate,
  collectMultiSessionDatasetV2_3,
  getStrategyV2_4CombinationDashboard,
  getStrategyV2_4Variants,
  getStrategyV2_4Ablation,
  getStrategyV2_4OosValidation,
  getStrategyV2_4PromotionGate,
  collectCombinationDatasetV2_4,
  getStrategyV2_5FinalValidationDashboard,
  getStrategyV2_5HeadToHead,
  getStrategyV2_5Sessions,
  getStrategyV2_5OosValidation,
  getStrategyV2_5ValidationGate,
  collectFinalValidationDatasetV2_5
} from '../controllers/research.controller';



const router = Router();

router.use(authMiddleware);

// Strategy V2: Quality-First Adaptive Paper Engine & Loss Analysis
router.post('/strategy-v2/evaluate-signal', evaluateStrategyV2Signal);
router.get('/strategy-v2/compare', compareStrategyV1VsV2);
router.post('/strategy-v2/compare', compareStrategyV1VsV2);
router.post('/strategy-v2/validate-oos', validateStrategyV2Oos);
router.get('/strategy-v2/journal', getStrategyV2Journal);
router.get('/strategy-v2/loss-analysis', getStrategyV2LossAnalysis);
router.get('/strategy-v2/loss-clusters', getStrategyV2LossClusters);
router.get('/strategy-v2/diagnostic-alerts', getStrategyV2DiagnosticAlerts);
router.get('/strategy-v2/validation-dashboard', getStrategyV2ValidationReport);
router.post('/strategy-v2/collect-demo-trades', collectDemoTrades);

// Strategy V2.1: Controlled Research Lab & Hypothesis Experiments
router.get('/strategy-v2-1/lab-dashboard', getStrategyV2_1LabDashboard);
router.get('/strategy-v2-1/experiment-matrix', getStrategyV2_1ExperimentMatrix);
router.get('/strategy-v2-1/duration-experiment', getStrategyV2_1DurationExperiment);
router.get('/strategy-v2-1/ranging-experiment', getStrategyV2_1RangingExperiment);
router.get('/strategy-v2-1/threshold-experiment', getStrategyV2_1ThresholdExperiment);
router.get('/strategy-v2-1/oos-validation', getStrategyV2_1OosValidation);
router.post('/strategy-v2-1/evaluate-signal', evaluateStrategyV2_1Signal);

// Strategy V2.2: Extended Fresh Validation Layer
router.get('/strategy-v2-2/fresh-dashboard', getStrategyV2_2FreshDashboard);
router.get('/strategy-v2-2/experiment-matrix', getStrategyV2_2ExperimentMatrix);
router.get('/strategy-v2-2/breakdowns', getStrategyV2_2Breakdowns);
router.get('/strategy-v2-2/confidence-intervals', getStrategyV2_2ConfidenceIntervals);
router.get('/strategy-v2-2/oos-validation', getStrategyV2_2OosValidation);
router.post('/strategy-v2-2/collect-fresh-dataset', collectFreshDatasetV2_2);

// Strategy V2.3: Multi-Session Validation & Promotion Gate Research Module
router.get('/strategy-v2-3/dashboard', getStrategyV2_3MultiSessionDashboard);
router.get('/strategy-v2-3/sessions', getStrategyV2_3SessionsList);
router.get('/strategy-v2-3/hypotheses', getStrategyV2_3HypothesesSummary);
router.get('/strategy-v2-3/cross-asset', getStrategyV2_3CrossAsset);
router.get('/strategy-v2-3/cross-regime', getStrategyV2_3CrossRegime);
router.get('/strategy-v2-3/oos-validation', getStrategyV2_3OosValidation);
router.get('/strategy-v2-3/promotion-gate', getStrategyV2_3PromotionGate);
router.post('/strategy-v2-3/collect-dataset', collectMultiSessionDatasetV2_3);

// Strategy V2.4: Combination & Ablation Research Phase
router.get('/strategy-v2-4/dashboard', getStrategyV2_4CombinationDashboard);
router.get('/strategy-v2-4/variants', getStrategyV2_4Variants);
router.get('/strategy-v2-4/ablation', getStrategyV2_4Ablation);
router.get('/strategy-v2-4/oos-validation', getStrategyV2_4OosValidation);
router.get('/strategy-v2-4/promotion-gate', getStrategyV2_4PromotionGate);
router.post('/strategy-v2-4/collect-dataset', collectCombinationDatasetV2_4);

// Strategy V2.5: Final Fresh Validation
router.get('/strategy-v2-5/dashboard', getStrategyV2_5FinalValidationDashboard);
router.get('/strategy-v2-5/head-to-head', getStrategyV2_5HeadToHead);
router.get('/strategy-v2-5/sessions', getStrategyV2_5Sessions);
router.get('/strategy-v2-5/oos-validation', getStrategyV2_5OosValidation);
router.get('/strategy-v2-5/validation-gate', getStrategyV2_5ValidationGate);
router.post('/strategy-v2-5/collect-dataset', collectFinalValidationDatasetV2_5);




// Advanced backtest & analytics
router.post('/backtest', runResearchBacktest);

// Parameter optimization & overfitting detection
router.post('/optimize', runOptimization);
router.get('/optimization/:id', getOptimizationRun);

// Walk-forward validation
router.post('/walk-forward', runWalkForward);
router.get('/walk-forward/:id', getWalkForwardRun);

// Out-of-sample testing
router.post('/oos-test', runOosTest);

// Monte Carlo trade sequence resampling
router.post('/monte-carlo', runMonteCarlo);

// Cross-strategy comparison
router.get('/comparison', compareResearchStrategies);

// Market regimes
router.get('/regimes', getMarketRegimes);

// Risk profiles & position sizing
router.get('/risk-profiles', getRiskProfiles);
router.post('/position-size', calculatePositionSize);

// Phase 5: Datasets
router.post('/datasets', uploadDataset);
router.get('/datasets', listDatasets);
router.get('/datasets/:id', getDatasetById);

// Phase 5: Multi-Asset & Timeframe
router.post('/cross-asset', runCrossAssetValidation);
router.post('/cross-timeframe', runCrossTimeframeValidation);

// Phase 5: Sensitivity Heatmap
router.post('/sensitivity-heatmap', runSensitivityHeatmap);

// Phase 5: Stress Testing
router.post('/stress-test', runStressTest);

// Phase 5: Portfolios
router.post('/portfolios', createPortfolio);
router.get('/portfolios', listPortfolios);
router.post('/portfolios/:portfolioId/simulate', simulatePortfolio);

// Phase 5: Experiments & Journal
router.post('/experiments', createExperiment);
router.get('/experiments', listExperiments);
router.patch('/experiments/:id/status', updateExperimentStatus);
router.post('/experiments/:id/trades', logExperimentTrade);
router.get('/experiments/:id/compare', compareExperiment);
router.get('/experiments/:id/timeline', getExperimentTimeline);

// Phase 5: Reports & Export
router.post('/report', generateResearchReport);
router.post('/export/csv', exportDataCsv);

// Phase 8: Advanced Research Lab & Control Center
router.get('/strategies', listResearchStrategies);
router.get('/strategies/:id', getResearchStrategy);
router.get('/ensemble', getEnsemble);
router.post('/ensemble', createOrUpdateEnsemble);
router.get('/correlation', getStrategyCorrelation);
router.get('/risk-attribution', getRiskAttribution);
router.get('/stability', getParameterStability);
router.post('/experiments/:id/clone', cloneExperiment);
router.post('/experiments/:id/tags', addExperimentTags);
router.get('/experiments/:id/replay', getReplay);
router.get('/experiments/:id/diagnostics/:tradeId', getTradeDiagnostics);
router.get('/experiments/:id/performance-stages', getPerformanceStages);

// Phase 9: Autonomous Research Orchestrator & Control Center
router.post('/jobs', submitResearchJob);
router.get('/jobs', listResearchJobs);
router.get('/jobs/:id', getResearchJobStatus);
router.post('/jobs/:id/pause', pauseResearchJob);
router.post('/jobs/:id/resume', resumeResearchJob);
router.post('/jobs/:id/cancel', cancelResearchJob);
router.post('/jobs/process-next', executeNextResearchJob);

router.post('/schedules', createResearchSchedule);
router.get('/schedules', listResearchSchedules);
router.patch('/schedules/:id/toggle', toggleResearchSchedule);

router.get('/strategies/:strategyId/drift-trends', getDriftTrends);
router.get('/recommendations', getResearchRecommendations);
router.post('/strategies/:strategyId/recommendations/generate', generateRecommendationsForStrategy);
router.patch('/recommendations/:id/dismiss', dismissRecommendation);

router.get('/evidence-matrix', getStrategyEvidenceMatrix);
router.get('/experiments/:expA/diff/:expB', compareExperimentConfigs);
router.get('/experiments/:id/lineage', getExperimentLineage);

router.post('/watchdog/inspect', inspectPaperWatchdog);
router.get('/watchdog/events', getWatchdogEvents);
router.post('/watchdog/strategies/:strategyId/resume', resumeWatchdogStrategy);

router.post('/anomalies/investigate', triggerAnomalyInvestigation);
router.get('/anomalies', getAnomalyInvestigations);

router.post('/stress-matrix', runStressMatrix);
router.get('/strategies/:strategyId/stress-matrix', getLatestStressMatrix);

router.post('/portfolios/:portfolioId/what-if', runPortfolioWhatIf);
router.get('/portfolios/:portfolioId/what-if', getPortfolioWhatIfRuns);

router.post('/regimes/transitions', recordRegimeTransition);
router.get('/regimes/transitions', getRegimeTransitions);

router.post('/reports/daily', generateDailyResearchReport);
router.get('/reports/daily', listDailyResearchReports);
router.post('/reports/weekly', generateWeeklyResearchReport);
router.get('/reports/weekly', listWeeklyResearchReports);

export default router;

