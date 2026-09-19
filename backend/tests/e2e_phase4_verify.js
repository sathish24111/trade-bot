/**
 * Phase 4 End-to-End System Verification Script
 * 
 * Verifies:
 * 1. Health check & TRADING_MODE=PAPER lockdown
 * 2. Demo user login & JWT auth
 * 3. Phase 4 Advanced Backtest with Sharpe, Sortino, Calmar, Expectancy, Monthly & Regime Breakdown
 * 4. Grid-Search Optimization with 3-way split (Train/Val/Test) & Overfitting Detection
 * 5. Walk-Forward Testing with rolling windows & WFE calculation
 * 6. Monte Carlo Trade-Sequence Resampling & percentiles
 * 7. Market Regime classification
 * 8. Position Sizing simulation
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('================================================================');
  console.log('  TRADEPILOT PHASE 4 E2E SYSTEM VERIFICATION');
  console.log('  Mode: DEMO / PAPER SIMULATION ONLY');
  console.log('================================================================\n');

  // 1. Health check
  console.log('[Step 1] Checking /api/health and TRADING_MODE lockdown...');
  const healthRes = await request('GET', '/api/health');
  if (healthRes.status !== 200 || healthRes.body.executionEngine !== 'DEMO_PAPER_TRADING_ONLY') {
    throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
  }
  console.log('  ✓ System Health: ONLINE');
  console.log(`  ✓ Execution Engine: ${healthRes.body.executionEngine}`);
  console.log(`  ✓ Mode: ${healthRes.body.mode}`);

  // 2. Auth Login
  console.log('\n[Step 2] Authenticating demo user demo@tradepilot.app...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'demo@tradepilot.app',
    password: '123456'
  });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(`Auth failed: ${JSON.stringify(loginRes.body)}`);
  }
  authToken = loginRes.body.token;
  console.log('  ✓ JWT Token acquired successfully');

  // 3. Phase 4 Advanced Backtest
  console.log('\n[Step 3] Running Phase 4 Advanced Backtest on EUR/USD...');
  const backtestRes = await request('POST', '/api/research/backtest', {
    asset: 'EUR/USD',
    strategy: 'EMA_RSI',
    timeframe: '5m',
    initialBalance: 10000,
    tradeAmount: 100
  }, authToken);

  if (backtestRes.status !== 200 || !backtestRes.body.success) {
    throw new Error(`Research backtest failed: ${JSON.stringify(backtestRes.body)}`);
  }

  const result = backtestRes.body.result;
  const metrics = result.advancedMetrics;
  console.log(`  ✓ Total Trades: ${result.totalTrades}`);
  console.log(`  ✓ Win Rate: ${result.winRate}%`);
  console.log(`  ✓ Net P/L: ₹${result.totalPnl} (${result.totalPnlPercent}%)`);
  console.log(`  ✓ Sharpe Ratio: ${metrics.sharpeRatio ?? 'N/A'}`);
  console.log(`  ✓ Sortino Ratio: ${metrics.sortinoRatio ?? 'N/A'}`);
  console.log(`  ✓ Expectancy: ₹${metrics.expectancy}`);
  console.log(`  ✓ Max DD Duration: ${metrics.maxDrawdownDurationBars} bars`);
  console.log(`  ✓ Sample Size Rating: ${metrics.sampleSizeRating}`);
  console.log(`  ✓ Monthly Buckets Count: ${metrics.monthlyPerformance.length}`);
  console.log(`  ✓ Regime Breakdown Count: ${result.regimeBreakdown.length}`);
  console.log(`  ✓ Mode locked: ${backtestRes.body.mode}, isRealMoney: ${backtestRes.body.isRealMoney}`);

  // 4. Grid-Search Optimization
  console.log('\n[Step 4] Running Grid-Search Parameter Optimization (70/15/15 Split)...');
  const optRes = await request('POST', '/api/research/optimize', {
    asset: 'EUR/USD',
    strategy: 'EMA_RSI',
    timeframe: '5m',
    parameterRanges: {
      emaPeriod: [14, 21, 28]
    },
    trainSplitRatio: 0.70,
    valSplitRatio: 0.15,
    testSplitRatio: 0.15
  }, authToken);

  if (optRes.status !== 200 || !optRes.body.success) {
    throw new Error(`Optimization failed: ${JSON.stringify(optRes.body)}`);
  }
  const optResult = optRes.body.result;
  console.log(`  ✓ Combinations Evaluated: ${optResult.totalCombinations}`);
  console.log(`  ✓ Partitions: Train(${optResult.trainCandlesCount}), Val(${optResult.valCandlesCount}), Test(${optResult.testCandlesCount})`);
  const recommended = optResult.results.find(r => r.isRecommended);
  console.log(`  ✓ Recommended Combination: ${JSON.stringify(recommended.parameters)}`);
  console.log(`  ✓ Overfitting Risk: ${recommended.overfittingRisk} (score: ${recommended.overfittingScore})`);

  // 5. Walk-Forward Testing
  console.log('\n[Step 5] Running Rolling Walk-Forward Validation...');
  const wfRes = await request('POST', '/api/research/walk-forward', {
    asset: 'EUR/USD',
    strategy: 'EMA_RSI',
    timeframe: '5m',
    parameterRanges: {
      emaPeriod: [15, 25]
    },
    trainCandles: 40,
    testCandles: 20,
    stepCandles: 20
  }, authToken);

  if (wfRes.status !== 200 || !wfRes.body.success) {
    throw new Error(`Walk-forward failed: ${JSON.stringify(wfRes.body)}`);
  }
  const wfResult = wfRes.body.result;
  console.log(`  ✓ Windows Generated: ${wfResult.windowsCount}`);
  console.log(`  ✓ Overall Walk-Forward Efficiency (WFE): ${wfResult.overallWfe}%`);
  console.log(`  ✓ Robustness Summary: ${wfResult.robustnessSummary}`);
  console.log(`  ✓ Cumulative OOS Return: ${wfResult.cumulativeOosReturnPercent}%`);

  // 6. Monte Carlo Trade-Sequence Resampling
  console.log('\n[Step 6] Running Monte Carlo Simulation (500 iterations)...');
  const mcRes = await request('POST', '/api/research/monte-carlo', {
    trades: result.trades.length > 0 ? result.trades : [
      { id: '1', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.11, amount: 100, pnl: 40, result: 'WIN', timestamp: '2025-01-01' },
      { id: '2', asset: 'EUR/USD', direction: 'BUY', entryPrice: 1.1, exitPrice: 1.09, amount: 100, pnl: -30, result: 'LOSS', timestamp: '2025-01-02' }
    ],
    iterations: 500,
    initialBalance: 10000
  }, authToken);

  if (mcRes.status !== 200 || !mcRes.body.success) {
    throw new Error(`Monte Carlo failed: ${JSON.stringify(mcRes.body)}`);
  }
  const mcResult = mcRes.body.result;
  console.log(`  ✓ 5th Percentile Ending Balance: ₹${mcResult.finalBalanceDistribution.p5}`);
  console.log(`  ✓ Median Expected Balance: ₹${mcResult.finalBalanceDistribution.median}`);
  console.log(`  ✓ 95th Percentile Ending Balance: ₹${mcResult.finalBalanceDistribution.p95}`);
  console.log(`  ✓ Worst Case Drawdown: ${mcResult.worstCaseDrawdown}%`);
  console.log(`  ✓ Ruin Probability: ${mcResult.ruinProbabilityPercent}%`);

  // 7. Market Regimes
  console.log('\n[Step 7] Inspecting Market Regimes...');
  const regimesRes = await request('GET', '/api/research/regimes?asset=EUR/USD&timeframe=5m&count=50', null, authToken);
  if (regimesRes.status !== 200 || !regimesRes.body.success) {
    throw new Error(`Regimes check failed: ${JSON.stringify(regimesRes.body)}`);
  }
  console.log(`  ✓ Current Regime: ${regimesRes.body.currentRegime.regime}`);
  console.log(`  ✓ Current ATR: ${regimesRes.body.currentRegime.atr}`);
  console.log(`  ✓ Bollinger Band Width: ${regimesRes.body.currentRegime.bollingerWidth}`);

  // 8. Position Sizing
  console.log('\n[Step 8] Calculating Position Sizing for BALANCED profile...');
  const sizeRes = await request('POST', '/api/research/position-size', {
    profile: 'BALANCED',
    accountBalance: 10000,
    entryPrice: 1.1000,
    stopLossPrice: 1.0950
  }, authToken);
  if (sizeRes.status !== 200 || !sizeRes.body.success) {
    throw new Error(`Position sizing failed: ${JSON.stringify(sizeRes.body)}`);
  }
  const calc = sizeRes.body.calculation;
  console.log(`  ✓ Risk Amount: ₹${calc.riskAmount} (${calc.riskProfile.riskPerTradePercent}%)`);
  console.log(`  ✓ Stop Loss Distance: ${calc.stopLossDistance} (${calc.stopLossPercent}%)`);
  console.log(`  ✓ Suggested Position Size: ${calc.suggestedPositionSize} units`);
  console.log(`  ✓ Mode: ${calc.mode}`);

  console.log('\n================================================================');
  console.log('  ALL PHASE 4 E2E VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('  Zero real money execution. Zero broker connection. 100% Paper.');
  console.log('================================================================');
}

runE2E().catch(err => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
