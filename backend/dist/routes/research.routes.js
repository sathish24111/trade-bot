"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const research_controller_1 = require("../controllers/research.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Advanced backtest & analytics
router.post('/backtest', research_controller_1.runResearchBacktest);
// Parameter optimization & overfitting detection
router.post('/optimize', research_controller_1.runOptimization);
router.get('/optimization/:id', research_controller_1.getOptimizationRun);
// Walk-forward validation
router.post('/walk-forward', research_controller_1.runWalkForward);
router.get('/walk-forward/:id', research_controller_1.getWalkForwardRun);
// Out-of-sample testing
router.post('/oos-test', research_controller_1.runOosTest);
// Monte Carlo trade sequence resampling
router.post('/monte-carlo', research_controller_1.runMonteCarlo);
// Cross-strategy comparison
router.get('/comparison', research_controller_1.compareResearchStrategies);
// Market regimes
router.get('/regimes', research_controller_1.getMarketRegimes);
// Risk profiles & position sizing
router.get('/risk-profiles', research_controller_1.getRiskProfiles);
router.post('/position-size', research_controller_1.calculatePositionSize);
// Phase 5: Datasets
router.post('/datasets', research_controller_1.uploadDataset);
router.get('/datasets', research_controller_1.listDatasets);
router.get('/datasets/:id', research_controller_1.getDatasetById);
// Phase 5: Multi-Asset & Timeframe
router.post('/cross-asset', research_controller_1.runCrossAssetValidation);
router.post('/cross-timeframe', research_controller_1.runCrossTimeframeValidation);
// Phase 5: Sensitivity Heatmap
router.post('/sensitivity-heatmap', research_controller_1.runSensitivityHeatmap);
// Phase 5: Stress Testing
router.post('/stress-test', research_controller_1.runStressTest);
// Phase 5: Portfolios
router.post('/portfolios', research_controller_1.createPortfolio);
router.get('/portfolios', research_controller_1.listPortfolios);
router.post('/portfolios/:portfolioId/simulate', research_controller_1.simulatePortfolio);
// Phase 5: Experiments & Journal
router.post('/experiments', research_controller_1.createExperiment);
router.get('/experiments', research_controller_1.listExperiments);
router.patch('/experiments/:id/status', research_controller_1.updateExperimentStatus);
router.post('/experiments/:id/trades', research_controller_1.logExperimentTrade);
router.get('/experiments/:id/compare', research_controller_1.compareExperiment);
router.get('/experiments/:id/timeline', research_controller_1.getExperimentTimeline);
// Phase 5: Reports & Export
router.post('/report', research_controller_1.generateResearchReport);
router.post('/export/csv', research_controller_1.exportDataCsv);
// Phase 8: Advanced Research Lab & Control Center
router.get('/strategies', research_controller_1.listResearchStrategies);
router.get('/strategies/:id', research_controller_1.getResearchStrategy);
router.get('/ensemble', research_controller_1.getEnsemble);
router.post('/ensemble', research_controller_1.createOrUpdateEnsemble);
router.get('/correlation', research_controller_1.getStrategyCorrelation);
router.get('/risk-attribution', research_controller_1.getRiskAttribution);
router.get('/stability', research_controller_1.getParameterStability);
router.post('/experiments/:id/clone', research_controller_1.cloneExperiment);
router.post('/experiments/:id/tags', research_controller_1.addExperimentTags);
router.get('/experiments/:id/replay', research_controller_1.getReplay);
router.get('/experiments/:id/diagnostics/:tradeId', research_controller_1.getTradeDiagnostics);
router.get('/experiments/:id/performance-stages', research_controller_1.getPerformanceStages);
// Phase 9: Autonomous Research Orchestrator & Control Center
router.post('/jobs', research_controller_1.submitResearchJob);
router.get('/jobs', research_controller_1.listResearchJobs);
router.get('/jobs/:id', research_controller_1.getResearchJobStatus);
router.post('/jobs/:id/pause', research_controller_1.pauseResearchJob);
router.post('/jobs/:id/resume', research_controller_1.resumeResearchJob);
router.post('/jobs/:id/cancel', research_controller_1.cancelResearchJob);
router.post('/jobs/process-next', research_controller_1.executeNextResearchJob);
router.post('/schedules', research_controller_1.createResearchSchedule);
router.get('/schedules', research_controller_1.listResearchSchedules);
router.patch('/schedules/:id/toggle', research_controller_1.toggleResearchSchedule);
router.get('/strategies/:strategyId/drift-trends', research_controller_1.getDriftTrends);
router.get('/recommendations', research_controller_1.getResearchRecommendations);
router.post('/strategies/:strategyId/recommendations/generate', research_controller_1.generateRecommendationsForStrategy);
router.patch('/recommendations/:id/dismiss', research_controller_1.dismissRecommendation);
router.get('/evidence-matrix', research_controller_1.getStrategyEvidenceMatrix);
router.get('/experiments/:expA/diff/:expB', research_controller_1.compareExperimentConfigs);
router.get('/experiments/:id/lineage', research_controller_1.getExperimentLineage);
router.post('/watchdog/inspect', research_controller_1.inspectPaperWatchdog);
router.get('/watchdog/events', research_controller_1.getWatchdogEvents);
router.post('/watchdog/strategies/:strategyId/resume', research_controller_1.resumeWatchdogStrategy);
router.post('/anomalies/investigate', research_controller_1.triggerAnomalyInvestigation);
router.get('/anomalies', research_controller_1.getAnomalyInvestigations);
router.post('/stress-matrix', research_controller_1.runStressMatrix);
router.get('/strategies/:strategyId/stress-matrix', research_controller_1.getLatestStressMatrix);
router.post('/portfolios/:portfolioId/what-if', research_controller_1.runPortfolioWhatIf);
router.get('/portfolios/:portfolioId/what-if', research_controller_1.getPortfolioWhatIfRuns);
router.post('/regimes/transitions', research_controller_1.recordRegimeTransition);
router.get('/regimes/transitions', research_controller_1.getRegimeTransitions);
router.post('/reports/daily', research_controller_1.generateDailyResearchReport);
router.get('/reports/daily', research_controller_1.listDailyResearchReports);
router.post('/reports/weekly', research_controller_1.generateWeeklyResearchReport);
router.get('/reports/weekly', research_controller_1.listWeeklyResearchReports);
exports.default = router;
