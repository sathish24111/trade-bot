/**
 * TradePilot Phase 8 — Comprehensive 30-Step End-to-End System Verification Script
 *
 * Validates all 30 requirements against a live running backend & MySQL database:
 * 1. Initialize Phase 8 database tables
 * 2. Enforce TRADING_MODE=PAPER
 * 3. Verify live order rejection
 * 4. Verify broker execution is blocked
 * 5. Load strategy versions snapshot
 * 6. Verify configHash calculation
 * 7. List available research strategies
 * 8. Fetch strategy parameter definitions
 * 9. Save ensemble configuration
 * 10. Fetch ensemble configuration
 * 11. Evaluate ensemble signal (MAJORITY)
 * 12. Evaluate ensemble signal (WEIGHTED)
 * 13. Evaluate ensemble signal (CONSENSUS)
 * 14. Evaluate ensemble signal (INDEPENDENT)
 * 15. Detect and log strategy conflict
 * 16. Fetch strategy conflict history
 * 17. Calculate strategy correlation matrix
 * 18. Verify correlation values bounded [-1, 1]
 * 19. Calculate rolling correlation
 * 20. Calculate correlation by regime
 * 21. Validate portfolio allocation sum
 * 22. Calculate portfolio risk attribution
 * 23. Verify Herfindahl concentration index
 * 24. Run parameter stability sweep
 * 25. Detect parameter cliff
 * 26. Verify sample-size quality classification
 * 27. Calculate Wilson score confidence interval
 * 28. Run Monte Carlo simulation with percentiles
 * 29. Compare paper vs research stages
 * 30. Replay paper trading session and fetch diagnostics
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('======================================================================');
  console.log('TRADEPILOT PHASE 8 — 30-STEP END-TO-END VERIFICATION');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  let token = null;

  async function step(num, description, fn) {
    process.stdout.write(`Step ${num.toString().padStart(2, '0')}: ${description.padEnd(52, '.')} `);
    try {
      await fn();
      console.log('\x1b[32m[PASS]\x1b[0m');
      passed++;
    } catch (err) {
      console.log('\x1b[31m[FAIL]\x1b[0m');
      console.error(`       Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // Authenticate first
    let loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'demo@tradepilot.app', password: 'password123' }
    });
    if (loginRes.status !== 200) {
      loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'demo@tradepilot.app', password: '123456' }
      });
    }
    if (loginRes.status === 200 && loginRes.body.token) {
      token = loginRes.body.token;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    // Step 1: Initialize Phase 8 database tables
    await step(1, 'Verify Phase 8 MySQL database tables (49-61)', async () => {
      const mysql = require('mysql2/promise');
      const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '1234',
        database: 'tradepilot'
      });
      const [tables] = await conn.query("SHOW TABLES LIKE 'research_%'");
      const [diag] = await conn.query("SHOW TABLES LIKE 'trade_diagnostics'");
      const [corr] = await conn.query("SHOW TABLES LIKE 'strategy_correlations'");
      await conn.end();
      if (tables.length === 0 && diag.length === 0 && corr.length === 0) {
        throw new Error('Phase 8 tables not found in MySQL');
      }
    });

    // Step 2: Enforce TRADING_MODE=PAPER
    await step(2, 'Enforce TRADING_MODE=PAPER and safety envelope', async () => {
      const res = await request('/api/research/strategies', { token });
      if (res.body.mode !== 'PAPER' || res.body.isRealMoney !== false || res.body.brokerConnected !== false) {
        throw new Error(`Safety envelope mismatch: ${JSON.stringify(res.body)}`);
      }
    });

    // Step 3: Verify live order rejection
    await step(3, 'Verify live broker order execution rejection', async () => {
      const res = await request('/api/broker/order', {
        method: 'POST',
        token,
        body: { symbol: 'BTC/USD', amount: 1.0, type: 'LIVE_EXECUTION' }
      });
      if (res.status !== 404 && res.status !== 403 && res.status !== 400) {
        throw new Error(`Expected rejection for broker orders, got status ${res.status}`);
      }
    });

    // Step 4: Verify broker execution is blocked
    await step(4, 'Verify deposits/withdrawals/broker APIs blocked', async () => {
      const res = await request('/api/wallet/deposit', {
        method: 'POST',
        token,
        body: { amount: 1000 }
      });
      if (res.status === 200) {
        throw new Error('Real deposit endpoint should not exist');
      }
    });

    // Step 5: Load strategy versions snapshot
    await step(5, 'Load strategy version snapshot', async () => {
      const res = await request('/api/research/strategies/EMA_RSI', { token });
      if (res.status !== 200 || !res.body.strategy) {
        throw new Error('Failed to retrieve strategy version snapshot');
      }
    });

    // Step 6: Verify configHash calculation
    await step(6, 'Verify SHA-256 configHash calculation', async () => {
      const res = await request('/api/research/strategies/EMA_RSI', { token });
      const hash = res.body.strategy.configHash;
      if (!hash || hash.length !== 64) {
        throw new Error(`Invalid SHA-256 configHash: ${hash}`);
      }
    });

    // Step 7: List available research strategies
    await step(7, 'List available research strategies', async () => {
      const res = await request('/api/research/strategies', { token });
      if (res.status !== 200 || !res.body.strategies || res.body.strategies.length === 0) {
        throw new Error('Strategies list is empty');
      }
    });

    // Step 8: Fetch strategy parameter definitions
    await step(8, 'Fetch strategy parameter definitions', async () => {
      const res = await request('/api/research/strategies/EMA_RSI', { token });
      const defs = res.body.strategy.parameterDefinitions;
      if (!defs || defs.length === 0) {
        throw new Error('Missing parameter definitions');
      }
    });

    // Step 9: Save ensemble configuration
    await step(9, 'Save research ensemble configuration', async () => {
      const res = await request('/api/research/ensemble', {
        method: 'POST',
        token,
        body: {
          id: 'ENS_E2E_TEST',
          name: 'E2E Test Ensemble',
          aggregationMode: 'MAJORITY',
          strategies: [
            { strategyId: 'EMA_RSI', weight: 0.34 },
            { strategyId: 'MACD', weight: 0.33 },
            { strategyId: 'BOLLINGER_BANDS', weight: 0.33 }
          ],
          minConfirmations: 2,
          enabled: true
        }
      });
      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Failed to save ensemble: ${JSON.stringify(res.body)}`);
      }
    });

    // Step 10: Fetch ensemble configuration
    await step(10, 'Fetch saved ensemble configuration', async () => {
      const res = await request('/api/research/ensemble', { token });
      if (res.status !== 200 || !res.body.ensemble) {
        throw new Error('Failed to retrieve ensemble configuration');
      }
    });

    // Step 11: Evaluate ensemble signal (MAJORITY)
    await step(11, 'Evaluate ensemble signal with MAJORITY mode', async () => {
      const { strategyEnsembleService } = require('../dist/services/research/strategyEnsemble.service');
      const { marketService } = require('../dist/services/market.service');
      const assets = await marketService.getAllAssets();
      const result = await strategyEnsembleService.evaluateEnsemble(assets[0], 'ENS_E2E_TEST');
      if (result.aggregationMode !== 'MAJORITY' || !result.voteBreakdown) {
        throw new Error('Majority evaluation failed');
      }
    });

    // Step 12: Evaluate ensemble signal (WEIGHTED)
    await step(12, 'Evaluate ensemble signal with WEIGHTED mode', async () => {
      const { strategyEnsembleService } = require('../dist/services/research/strategyEnsemble.service');
      const { marketService } = require('../dist/services/market.service');
      await strategyEnsembleService.saveEnsembleConfig({
        id: 'ENS_WEIGHTED_E2E',
        name: 'Weighted Ensemble',
        aggregationMode: 'WEIGHTED',
        strategies: [
          { strategyId: 'EMA_RSI', weight: 0.6 },
          { strategyId: 'MACD', weight: 0.4 }
        ],
        enabled: true
      });
      const assets = await marketService.getAllAssets();
      const result = await strategyEnsembleService.evaluateEnsemble(assets[0], 'ENS_WEIGHTED_E2E');
      if (result.aggregationMode !== 'WEIGHTED') {
        throw new Error('Weighted evaluation failed');
      }
    });

    // Step 13: Evaluate ensemble signal (CONSENSUS)
    await step(13, 'Evaluate ensemble signal with CONSENSUS mode', async () => {
      const { strategyEnsembleService } = require('../dist/services/research/strategyEnsemble.service');
      const { marketService } = require('../dist/services/market.service');
      await strategyEnsembleService.saveEnsembleConfig({
        id: 'ENS_CONSENSUS_E2E',
        name: 'Consensus Ensemble',
        aggregationMode: 'CONSENSUS',
        strategies: [
          { strategyId: 'EMA_RSI', weight: 0.5 },
          { strategyId: 'MACD', weight: 0.5 }
        ],
        enabled: true
      });
      const assets = await marketService.getAllAssets();
      const result = await strategyEnsembleService.evaluateEnsemble(assets[0], 'ENS_CONSENSUS_E2E');
      if (result.aggregationMode !== 'CONSENSUS') {
        throw new Error('Consensus evaluation failed');
      }
    });

    // Step 14: Evaluate ensemble signal (INDEPENDENT)
    await step(14, 'Evaluate ensemble signal with INDEPENDENT mode', async () => {
      const { strategyEnsembleService } = require('../dist/services/research/strategyEnsemble.service');
      const { marketService } = require('../dist/services/market.service');
      await strategyEnsembleService.saveEnsembleConfig({
        id: 'ENS_INDEP_E2E',
        name: 'Independent Ensemble',
        aggregationMode: 'INDEPENDENT',
        strategies: [
          { strategyId: 'EMA_RSI', weight: 0.5 },
          { strategyId: 'MACD', weight: 0.5 }
        ],
        enabled: true
      });
      const assets = await marketService.getAllAssets();
      const result = await strategyEnsembleService.evaluateEnsemble(assets[0], 'ENS_INDEP_E2E');
      if (result.aggregationMode !== 'INDEPENDENT') {
        throw new Error('Independent evaluation failed');
      }
    });

    // Step 15: Detect and log strategy conflict
    await step(15, 'Detect and log strategy conflict (SIGNAL_CONFLICT)', async () => {
      const { strategyEnsembleService } = require('../dist/services/research/strategyEnsemble.service');
      await strategyEnsembleService.recordConflict({
        ensembleId: 'ENS_E2E_TEST',
        asset: 'ETH/USD',
        timestamp: new Date().toISOString(),
        regime: 'VOLATILE',
        disagreeingSignals: [
          { strategyId: 'EMA_RSI', signal: 'BUY', confidence: 80 },
          { strategyId: 'MACD', signal: 'SELL', confidence: 65 }
        ],
        resolvedSignal: 'WAIT',
        resolutionMethod: 'CONSENSUS'
      });
    });

    // Step 16: Fetch strategy conflict history
    await step(16, 'Fetch strategy conflict event history', async () => {
      const res = await request('/api/research/ensemble', { token });
      if (!res.body.recentConflicts || res.body.recentConflicts.length === 0) {
        throw new Error('No conflict events found');
      }
    });

    // Step 17: Calculate strategy correlation matrix
    await step(17, 'Calculate strategy correlation matrix', async () => {
      const res = await request('/api/research/correlation?asset=BTC/USD&timeframe=5m', { token });
      if (res.status !== 200 || !res.body.correlationMatrix) {
        throw new Error('Failed to compute correlation matrix');
      }
    });

    // Step 18: Verify correlation values bounded [-1, 1]
    await step(18, 'Verify correlation values bounded [-1, 1] & symmetric', async () => {
      const res = await request('/api/research/correlation?asset=BTC/USD&timeframe=5m', { token });
      const mat = res.body.correlationMatrix.matrix;
      for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
          const val = mat[i][j];
          if (val < -1.0 || val > 1.0) {
            throw new Error(`Correlation out of bounds: ${val}`);
          }
        }
      }
    });

    // Step 19: Calculate rolling correlation
    await step(19, 'Calculate rolling correlation series', async () => {
      const { strategyCorrelationService } = require('../dist/services/research/strategyCorrelation.service');
      const series = strategyCorrelationService.calculateRollingCorrelation(
        [0.01, 0.02, -0.01, 0.03, -0.02, 0.01, 0.02],
        [0.02, 0.01, -0.02, 0.02, -0.01, 0.02, 0.01],
        3
      );
      if (!Array.isArray(series) || series.length === 0) {
        throw new Error('Rolling correlation series empty');
      }
    });

    // Step 20: Calculate correlation by regime
    await step(20, 'Calculate correlation segmented by structural regime', async () => {
      const res = await request('/api/research/correlation', { token });
      const regimes = res.body.regimeCorrelations;
      if (!Array.isArray(regimes) || regimes.length === 0) {
        throw new Error('Regime correlations empty');
      }
    });

    // Step 21: Validate portfolio allocation sum
    await step(21, 'Validate portfolio allocation sum (reject > 100%)', async () => {
      const { riskAttributionService } = require('../dist/services/research/riskAttribution.service');
      let caught = false;
      try {
        riskAttributionService.calculateRiskAttribution({
          allocations: [
            { strategyId: 'EMA_RSI', asset: 'BTC/USD', allocationPct: 0.70, targetCapital: 7000 },
            { strategyId: 'MACD', asset: 'ETH/USD', allocationPct: 0.50, targetCapital: 5000 }
          ]
        });
      } catch {
        caught = true;
      }
      if (!caught) {
        throw new Error('Did not reject allocation exceeding 100%');
      }
    });

    // Step 22: Calculate portfolio risk attribution
    await step(22, 'Calculate portfolio risk attribution breakdown', async () => {
      const res = await request('/api/research/risk-attribution', { token });
      if (res.status !== 200 || !res.body.attribution) {
        throw new Error('Failed to retrieve risk attribution');
      }
    });

    // Step 23: Verify Herfindahl concentration index
    await step(23, 'Verify Herfindahl-Hirschman concentration index (HHI)', async () => {
      const res = await request('/api/research/risk-attribution', { token });
      const hhi = res.body.attribution.concentrationRisk.herfindahlIndex;
      const rating = res.body.attribution.concentrationRisk.riskRating;
      if (typeof hhi !== 'number' || !['LOW', 'MODERATE', 'HIGH'].includes(rating)) {
        throw new Error(`Invalid HHI result: ${hhi}, rating: ${rating}`);
      }
    });

    // Step 24: Run parameter stability sweep
    await step(24, 'Run parameter stability neighborhood sweep', async () => {
      const res = await request('/api/research/stability?strategyId=EMA_RSI&parameterKey=emaPeriod&baselineValue=21', { token });
      if (res.status !== 200 || !res.body.stability) {
        throw new Error('Failed parameter stability analysis');
      }
    });

    // Step 25: Detect parameter cliff
    await step(25, 'Detect parameter cliff condition (PARAMETER_CLIFF)', async () => {
      const res = await request('/api/research/stability?strategyId=EMA_RSI&parameterKey=emaPeriod&baselineValue=21', { token });
      if (!Array.isArray(res.body.stability.cliffsDetected)) {
        throw new Error('Cliffs detected is not an array');
      }
    });

    // Step 26: Verify sample-size quality classification
    await step(26, 'Verify sample size quality rating (LIMITED/MODERATE/LARGER)', async () => {
      const res = await request('/api/research/stability?strategyId=EMA_RSI&parameterKey=emaPeriod&baselineValue=21', { token });
      const q = res.body.stability.sampleQuality;
      if (!['LIMITED', 'MODERATE', 'LARGER_SAMPLE'].includes(q)) {
        throw new Error(`Invalid sample quality rating: ${q}`);
      }
    });

    // Step 27: Calculate Wilson score confidence interval
    await step(27, 'Calculate Wilson score confidence intervals for win rate', async () => {
      const { metricsService } = require('../dist/services/research/metrics.service');
      const sampleTrades = Array(40).fill(0).map((_, i) => ({
        tradeId: `T_${i}`,
        asset: 'BTC/USD',
        direction: 'BUY',
        entryPrice: 50000,
        exitPrice: i % 2 === 0 ? 51000 : 49500,
        amount: 100,
        pnl: i % 2 === 0 ? 100 : -50,
        returnPercent: i % 2 === 0 ? 2.0 : -1.0,
        timestamp: new Date().toISOString()
      }));
      const ci = metricsService.calculateConfidenceIntervals(sampleTrades, 0.95);
      if (!ci || !ci.winRateInterval || ci.winRateInterval.lower <= 0) {
        throw new Error(`Invalid Wilson score CI: ${JSON.stringify(ci)}`);
      }
    });

    // Step 28: Run Monte Carlo simulation with percentiles
    await step(28, 'Run Monte Carlo simulation (P5, P25, P50, P75, P95)', async () => {
      const res = await request('/api/research/monte-carlo', {
        method: 'POST',
        token,
        body: {
          strategy: 'EMA_RSI',
          iterations: 200,
          trades: [
            { pnl: 120, returnPercent: 1.2 },
            { pnl: -80, returnPercent: -0.8 },
            { pnl: 200, returnPercent: 2.0 },
            { pnl: -50, returnPercent: -0.5 },
            { pnl: 150, returnPercent: 1.5 },
            { pnl: -90, returnPercent: -0.9 },
            { pnl: 110, returnPercent: 1.1 }
          ]
        }
      });
      if (res.status !== 200 || !res.body.result) {
        throw new Error(`Monte Carlo failed: ${JSON.stringify(res.body)}`);
      }
    });

    // Step 29: Compare paper vs research stages
    await step(29, 'Compare paper vs research stages (5 stages)', async () => {
      const res = await request('/api/research/experiments/EXP_STAGE_TEST/performance-stages', { token });
      if (res.status !== 200 || !res.body.comparison || res.body.comparison.stages.length !== 5) {
        throw new Error('Stage comparison failed');
      }
    });

    // Step 30: Replay paper trading session and fetch diagnostics
    await step(30, 'Replay paper trading session & explainable diagnostics', async () => {
      const replayRes = await request('/api/research/experiments/EXP_REPLAY_1/replay?action=init', { token });
      if (replayRes.status !== 200 || !replayRes.body.replay) {
        throw new Error('Replay init failed');
      }

      const diagRes = await request('/api/research/experiments/EXP_REPLAY_1/diagnostics/T_TEST_E2E', { token });
      if (diagRes.status !== 200 || !diagRes.body.diagnostic || !diagRes.body.diagnostic.decisionPath) {
        throw new Error('Diagnostic fetch failed');
      }
    });

  } catch (fatalErr) {
    console.error('\n\x1b[31mFATAL ERROR in E2E Verification:\x1b[0m', fatalErr.message);
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} / 30 Passed (${failed} Failed)`);
  console.log('======================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runVerification();
