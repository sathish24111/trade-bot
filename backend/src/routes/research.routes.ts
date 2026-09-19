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
  listWeeklyResearchReports
} from '../controllers/research.controller';


const router = Router();

router.use(authMiddleware);

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

