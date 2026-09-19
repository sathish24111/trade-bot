/**
 * TradePilot Phase 5 End-to-End System Verification Suite
 * 27-Step Automated Verification against live backend & MySQL database
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testDatasetId = '';
let testPortfolioId = '';
let testExperimentId = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type'] && res.headers['content-type'].includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('  TRADEPILOT PHASE 5 E2E SYSTEM VERIFICATION (27 STEPS)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function step(name, fn) {
    try {
      process.stdout.write(`Step ${passed + failed + 1}: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // Step 1: Health Check & Safety Metadata
  await step('Server Health & Safety Guardrails', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.mode !== 'PAPER' || res.body.isRealMoney !== false || res.body.brokerConnected !== false) {
      throw new Error('Safety metadata missing or violated');
    }
  });

  // Step 2: Auth Login with Demo Credentials
  await step('Demo User Authentication (demo@tradepilot.app)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'demo@tradepilot.app',
      password: '123456'
    });
    if (res.status !== 200 || !res.body.token) throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    authToken = res.body.token;
  });

  // Step 3: Simulated Market Data Quote Check
  await step('Simulated Market Quotes Sanity', async () => {
    const res = await request('GET', '/api/market/assets', null, authToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const btc = res.body.assets.find(a => a.symbol === 'BTC/USD');
    if (!btc || btc.isLive !== false || btc.status !== 'SIMULATED') {
      throw new Error('Asset is improperly labeled as LIVE');
    }
  });

  // Step 4: Upload Canonical Dataset
  await step('Historical Dataset Upload & Validation', async () => {
    const baseTime = 1700000000000;
    const candles = [];
    for (let i = 0; i < 60; i++) {
      candles.push({
        timestamp: baseTime + i * 300000,
        open: 50000 + i * 10,
        high: 50020 + i * 10,
        low: 49990 + i * 10,
        close: 50015 + i * 10,
        volume: 100
      });
    }

    const res = await request('POST', '/api/research/datasets', {
      name: 'E2E BTC Canonical 5m',
      asset: 'BTC/USD',
      timeframe: '5m',
      candles
    }, authToken);

    if (res.status !== 200 || !res.body.metadata) throw new Error(`Upload failed: ${JSON.stringify(res.body)}`);
    testDatasetId = res.body.metadata.id;
    if (!res.body.validationReport.passed) throw new Error('Validation report should have passed');
    if (!res.body.metadata.sha256Checksum) throw new Error('Missing SHA-256 checksum');
  });

  // Step 5: Dataset Quality & Gap Detection
  await step('Dataset Quality & Gap Detection (DATA_GAP_DETECTED)', async () => {
    const baseTime = 1700000000000;
    const candlesWithGap = [
      { timestamp: baseTime, open: 100, high: 105, low: 98, close: 102, volume: 50 },
      { timestamp: baseTime + 1800000, open: 102, high: 108, low: 100, close: 107, volume: 50 }, // 30m gap on 5m
      { timestamp: baseTime + 2100000, open: 107, high: 90, low: 95, close: 100, volume: 50 } // Invalid OHLC: high < low
    ];

    const res = await request('POST', '/api/research/datasets', {
      name: 'E2E Corrupted Dataset',
      asset: 'BTC/USD',
      timeframe: '5m',
      candles: candlesWithGap
    }, authToken);

    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const report = res.body.validationReport;
    if (report.gapCount < 1) throw new Error('Failed to detect data gap');
    if (!report.warnings.some(w => w.includes('DATA_GAP_DETECTED'))) throw new Error('DATA_GAP_DETECTED warning missing');
    if (report.invalidOhlcCandles !== 1) throw new Error('Failed to reject corrupted OHLC candle');
  });

  // Step 6: List Datasets
  await step('List Historical Datasets', async () => {
    const res = await request('GET', '/api/research/datasets', null, authToken);
    if (res.status !== 200 || !res.body.datasets) throw new Error(`Status ${res.status}`);
    if (res.body.datasets.length === 0) throw new Error('Datasets list should not be empty');
  });

  // Step 7: Get Dataset By ID
  await step('Get Dataset By ID', async () => {
    const res = await request('GET', `/api/research/datasets/${testDatasetId}`, null, authToken);
    if (res.status !== 200 || !res.body.dataset) throw new Error(`Status ${res.status}`);
    if (res.body.dataset.metadata.id !== testDatasetId) throw new Error('Dataset ID mismatch');
  });

  // Step 8: Cross-Asset Strategy Validation
  await step('Cross-Asset Robustness Matrix', async () => {
    const res = await request('POST', '/api/research/cross-asset', {
      strategy: 'EMA_RSI',
      assets: ['BTC/USD', 'ETH/USD', 'EUR/USD'],
      timeframe: '5m',
      candleCount: 50
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (res.body.result.assets.length !== 3) throw new Error('Expected 3 assets in result matrix');
  });

  // Step 9: Cross-Timeframe Strategy Validation
  await step('Cross-Timeframe Robustness Matrix', async () => {
    const res = await request('POST', '/api/research/cross-timeframe', {
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframes: ['1m', '5m', '15m'],
      candleCount: 50
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (res.body.result.timeframes.length !== 3) throw new Error('Expected 3 timeframes in matrix');
  });

  // Step 10: Parameter Sensitivity Heatmap
  await step('2D Parameter Sensitivity Heatmap & Cliff Detection', async () => {
    const res = await request('POST', '/api/research/sensitivity-heatmap', {
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      param1Name: 'fastEmaPeriod',
      param1Range: [8, 10],
      param2Name: 'slowEmaPeriod',
      param2Range: [20, 25],
      candleCount: 50
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (res.body.result.matrix.length !== 4) throw new Error('Heatmap should contain 4 points');
  });

  // Step 11: Stress Testing Engine
  await step('Stress Testing Engine (Cost Multipliers 1.0x to 3.0x)', async () => {
    const res = await request('POST', '/api/research/stress-test', {
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      candleCount: 50
    }, authToken);
    if (res.status !== 200 || !res.body.report) throw new Error(`Status ${res.status}`);
    if (res.body.report.scenarios.length < 4) throw new Error('Scenarios count too low');
    if (!res.body.report.disclaimer) throw new Error('Missing stress test disclaimer');
  });

  // Step 12: Anchored Walk-Forward Validation
  await step('Anchored Walk-Forward Validation', async () => {
    const res = await request('POST', '/api/research/walk-forward', {
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      parameterRanges: { fastEmaPeriod: [9], slowEmaPeriod: [21] },
      trainCandles: 40,
      testCandles: 15,
      stepCandles: 15,
      walkForwardMethod: 'ANCHORED',
      minWindowsRequired: 1
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (res.body.result.walkForwardMethod !== 'ANCHORED') throw new Error('Method should be ANCHORED');
  });

  // Step 13: Rolling Walk-Forward Validation
  await step('Rolling Walk-Forward Validation', async () => {
    const res = await request('POST', '/api/research/walk-forward', {
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      parameterRanges: { fastEmaPeriod: [9], slowEmaPeriod: [21] },
      trainCandles: 40,
      testCandles: 15,
      stepCandles: 15,
      walkForwardMethod: 'ROLLING'
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (res.body.result.walkForwardMethod !== 'ROLLING') throw new Error('Method should be ROLLING');
  });

  // Step 14: Walk-Forward Window Guard
  await step('Walk-Forward Minimum Window Guard Warning', async () => {
    const res = await request('POST', '/api/research/walk-forward', {
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      parameterRanges: { fastEmaPeriod: [9], slowEmaPeriod: [21] },
      trainCandles: 40,
      testCandles: 15,
      stepCandles: 15,
      walkForwardMethod: 'ROLLING',
      minWindowsRequired: 20 // High threshold
    }, authToken);
    if (res.status !== 200 || !res.body.result) throw new Error(`Status ${res.status}`);
    if (!res.body.result.windowGuardWarning || !res.body.result.windowGuardWarning.includes('⚠ Insufficient Walk-Forward Windows')) {
      throw new Error('Window guard warning was not triggered');
    }
  });

  // Step 15: Create Portfolio (Valid allocation <= 100%)
  await step('Portfolio Creation (Max 100% Allocation)', async () => {
    const res = await request('POST', '/api/research/portfolios', {
      name: 'E2E Multi-Asset Portfolio',
      initialCapital: 10000,
      allocations: [
        { asset: 'BTC/USD', strategy: 'EMA_RSI', weightPercent: 50 },
        { asset: 'ETH/USD', strategy: 'MACD', weightPercent: 30 },
        { asset: 'EUR/USD', strategy: 'BOLLINGER_BANDS', weightPercent: 20 }
      ],
      maxPortfolioDrawdownPercent: 12.0
    }, authToken);
    if (res.status !== 200 || !res.body.portfolio) throw new Error(`Status ${res.status}`);
    testPortfolioId = res.body.portfolio.id;
    if (res.body.portfolio.allocations[0].allocatedCapital !== 5000) throw new Error('Capital allocation incorrect');
  });

  // Step 16: Portfolio Over-Allocation Rejection (> 100%)
  await step('Portfolio Over-Allocation Rejection (> 100%)', async () => {
    const res = await request('POST', '/api/research/portfolios', {
      name: 'Invalid Portfolio',
      initialCapital: 10000,
      allocations: [
        { asset: 'BTC/USD', strategy: 'EMA_RSI', weightPercent: 60 },
        { asset: 'ETH/USD', strategy: 'MACD', weightPercent: 50 }
      ]
    }, authToken);
    if (res.status !== 400 || !res.body.error.includes('exceeds maximum limit of 100%')) {
      throw new Error(`Should have rejected over-allocation: ${JSON.stringify(res.body)}`);
    }
  });

  // Step 17: List User Portfolios
  await step('List User Portfolios', async () => {
    const res = await request('GET', '/api/research/portfolios', null, authToken);
    if (res.status !== 200 || !res.body.portfolios) throw new Error(`Status ${res.status}`);
    if (res.body.portfolios.length === 0) throw new Error('Portfolios list empty');
  });

  // Step 18: Portfolio Paper Simulation & Correlation Matrix
  await step('Portfolio Paper Simulation & Pearson Correlations', async () => {
    const res = await request('POST', `/api/research/portfolios/${testPortfolioId}/simulate?candleCount=50`, null, authToken);
    if (res.status !== 200 || !res.body.simulation) throw new Error(`Simulation failed: ${JSON.stringify(res.body)}`);
    const sim = res.body.simulation;
    if (sim.equityCurve.length === 0) throw new Error('Portfolio equity curve is empty');
    if (!sim.correlationMatrix || sim.correlationMatrix.matrix.length !== 3) {
      throw new Error('Pearson correlation matrix missing or invalid');
    }
  });

  // Step 19: Portfolio Risk Limit Enforcement
  await step('Portfolio Risk Limit Trigger (PORTFOLIO_RISK_LIMIT_REACHED)', async () => {
    // Create portfolio with very low drawdown threshold (0.01%)
    const res = await request('POST', '/api/research/portfolios', {
      name: 'Sensitive DD Portfolio',
      initialCapital: 10000,
      allocations: [{ asset: 'BTC/USD', strategy: 'EMA_RSI', weightPercent: 100 }],
      maxPortfolioDrawdownPercent: 0.01
    }, authToken);
    const pId = res.body.portfolio.id;
    const simRes = await request('POST', `/api/research/portfolios/${pId}/simulate?candleCount=50`, null, authToken);
    if (!simRes.body.simulation.riskLimitReached && simRes.body.simulation.maxDrawdownPercent > 0.01) {
      throw new Error('Risk limit was not triggered despite drawdown breach');
    }
  });

  // Step 20: Paper Experiment Creation & Config Lock Hash
  await step('Paper Experiment Creation & Immutable Config Hash', async () => {
    const res = await request('POST', '/api/research/experiments', {
      name: 'E2E Forward Paper Experiment',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      parameters: { fastEmaPeriod: 9, slowEmaPeriod: 21 },
      startBalance: 10000
    }, authToken);
    if (res.status !== 200 || !res.body.experiment) throw new Error(`Create experiment failed: ${JSON.stringify(res.body)}`);
    testExperimentId = res.body.experiment.id;
    if (!res.body.experiment.configHash) throw new Error('Missing immutable configHash');
    if (res.body.experiment.status !== 'CREATED') throw new Error('Status should be CREATED');
  });

  // Step 21: Experiment Lifecycle Transitions
  await step('Experiment Lifecycle (CREATED -> RUNNING -> PAUSED)', async () => {
    const runRes = await request('PATCH', `/api/research/experiments/${testExperimentId}/status`, { status: 'RUNNING' }, authToken);
    if (runRes.status !== 200 || runRes.body.experiment.status !== 'RUNNING') throw new Error('Transition to RUNNING failed');

    const pauseRes = await request('PATCH', `/api/research/experiments/${testExperimentId}/status`, { status: 'PAUSED' }, authToken);
    if (pauseRes.status !== 200 || pauseRes.body.experiment.status !== 'PAUSED') throw new Error('Transition to PAUSED failed');

    // Resume to RUNNING
    await request('PATCH', `/api/research/experiments/${testExperimentId}/status`, { status: 'RUNNING' }, authToken);
  });

  // Step 22: Paper Trade Journal Entry
  await step('Log Paper Trade to Experiment Journal', async () => {
    const res = await request('POST', `/api/research/experiments/${testExperimentId}/trades`, {
      direction: 'BUY',
      entryPrice: 50000,
      exitPrice: 51200,
      amount: 1000,
      slippage: 0.0001,
      fees: 0.50,
      journalNotes: 'E2E Trade entry: verified bullish trend'
    }, authToken);
    if (res.status !== 200 || !res.body.trade) throw new Error(`Log trade failed: ${JSON.stringify(res.body)}`);
    if (res.body.trade.result !== 'WIN' || res.body.trade.pnl <= 0) throw new Error('Trade PnL should be positive win');
  });

  // Step 23: Backtest vs Paper Divergence Assessment
  await step('Backtest vs Paper Divergence Assessment', async () => {
    const res = await request('GET', `/api/research/experiments/${testExperimentId}/compare`, null, authToken);
    if (res.status !== 200 || !res.body.comparison) throw new Error(`Compare failed: ${JSON.stringify(res.body)}`);
    const comp = res.body.comparison;
    if (comp.paperWinRate === undefined || comp.backtestWinRate === undefined) {
      throw new Error('Comparison metrics missing');
    }
  });

  // Step 24: List Experiments
  await step('List Paper Experiments', async () => {
    const res = await request('GET', '/api/research/experiments', null, authToken);
    if (res.status !== 200 || !res.body.experiments) throw new Error(`Status ${res.status}`);
    if (res.body.experiments.length === 0) throw new Error('Experiments list empty');
  });

  // Step 25: Generate Comprehensive Research Report
  await step('Comprehensive Research Report Generation', async () => {
    const res = await request('POST', '/api/research/report', {
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      candleCount: 60
    }, authToken);
    if (res.status !== 200 || !res.body.report) throw new Error(`Report generation failed: ${JSON.stringify(res.body)}`);
    const rep = res.body.report;
    if (!rep.evidenceBasedConclusion || !rep.disclaimer) throw new Error('Report conclusion or disclaimer missing');
    if (rep.mode !== 'PAPER' || rep.isRealMoney !== false) throw new Error('Safety mode header missing');
  });

  // Step 26: Export Data to CSV
  await step('Research Data Export to CSV', async () => {
    const res = await request('POST', '/api/research/export/csv', {
      rows: [
        { tradeId: 'T1', asset: 'BTC/USD', pnl: 24.5, result: 'WIN' },
        { tradeId: 'T2', asset: 'BTC/USD', pnl: -12.0, result: 'LOSS' }
      ],
      filename: 'test_trades.csv'
    }, authToken);
    if (res.status !== 200) throw new Error(`CSV export failed: status ${res.status}`);
    if (!res.body.includes('tradeId,asset,pnl,result')) throw new Error('CSV content headers missing');
  });

  // Step 27: Strict Live Broker / Real Money Kill Switch
  await step('Kill Switch Guard: Zero Broker / Real Money Transactions', async () => {
    if (process.env.TRADING_MODE && process.env.TRADING_MODE !== 'PAPER') {
      throw new Error('TRADING_MODE is not set to PAPER');
    }
    const res = await request('GET', '/api/health');
    if (res.body.mode !== 'PAPER' || res.body.brokerConnected === true) {
      throw new Error('Broker connected flag is improperly enabled');
    }
  });

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 27 PHASE 5 SYSTEM VERIFICATION CHECKS PASSED!\n');
    process.exit(0);
  }
}

runVerification().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
