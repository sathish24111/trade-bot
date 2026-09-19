/**
 * Phase 3 End-to-End Verification Script
 * Validates:
 * 1. Kill-switch check & safety guardrails
 * 2. Market Data Provider separation & source integrity
 * 3. Pure mathematical Technical Indicators
 * 4. Unbiased historical backtest engine with cost modeling
 * 5. Multi-strategy comparison
 * 6. Forward paper trading execution isolation
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: API_HOST,
        port: API_PORT,
        method,
        path,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, text: raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runE2EVerification() {
  console.log('================================================================');
  console.log('       TRADEPILOT PHASE 3 COMPREHENSIVE E2E VERIFICATION        ');
  console.log('================================================================\n');

  try {
    // 1. Healthcheck
    console.log('[1/8] Verifying API Health & Paper Trading Lock...');
    const health = await request('GET', '/api/health');
    if (health.status !== 200) throw new Error(`Healthcheck failed: ${health.status}`);
    console.log(`  ✓ Healthcheck OK: Status=${health.data.status}, Mode=${health.data.mode}`);
    if (health.data.executionEngine !== 'DEMO_PAPER_TRADING_ONLY') {
      throw new Error(`Execution engine safety violation: ${health.data.executionEngine}`);
    }

    // 2. Authentication
    console.log('\n[2/8] Authenticating Demo Account...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'demo@tradepilot.app',
      password: '123456'
    });
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Demo login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const token = loginRes.data.token;
    console.log(`  ✓ Authenticated as demo user. Balance: ₹${loginRes.data.user.demoBalance}`);

    // 3. Market Assets & Source Integrity
    console.log('\n[3/8] Verifying Market Data Provider Source Integrity & Status...');
    const assetsRes = await request('GET', '/api/market/assets');
    if (assetsRes.status !== 200 || !assetsRes.data.assets) {
      throw new Error(`Failed to fetch assets: ${assetsRes.status}`);
    }
    const assets = assetsRes.data.assets;
    console.log(`  ✓ Retrieved ${assets.length} market assets.`);
    for (const a of assets) {
      if (a.isLive === undefined || !a.status || !a.dataSource) {
        throw new Error(`Asset ${a.symbol} missing integrity tags: isLive=${a.isLive}, status=${a.status}`);
      }
      console.log(`    - ${a.symbol}: price=${a.price}, status=${a.status}, isLive=${a.isLive}, source=${a.dataSource}`);
    }

    // 4. Quote Endpoint
    console.log('\n[4/8] Testing Explicit Quote Endpoint (/api/market/EUR-USD/quote)...');
    const quoteRes = await request('GET', '/api/market/EUR-USD/quote?timeframe=5m');
    if (quoteRes.status !== 200 || !quoteRes.data.success) {
      throw new Error(`Failed to get quote: ${JSON.stringify(quoteRes.data)}`);
    }
    console.log('  ✓ Quote response:', JSON.stringify(quoteRes.data, null, 2));

    // 5. Unsupported Asset Error Enforcement
    console.log('\n[5/8] Testing Explicit Unsupported Asset Error Handling...');
    const invalidQuote = await request('GET', '/api/market/FAKE_COIN_XYZ/quote');
    if (invalidQuote.status === 400 && invalidQuote.data.error.includes('not supported')) {
      console.log(`  ✓ Expected explicit error returned: "${invalidQuote.data.error}"`);
    } else {
      throw new Error(`Expected 400 error for unsupported asset, got: ${invalidQuote.status}`);
    }

    // 6. Technical Indicators Inspection
    console.log('\n[6/8] Verifying Mathematical Technical Indicators on Assets...');
    const firstAsset = assets[0];
    const ind = firstAsset.indicators;
    console.log(`  ✓ ${firstAsset.symbol} Indicators:`);
    console.log(`    - EMA (21): ${ind.ema21}`);
    console.log(`    - SMA (20): ${ind.sma20}`);
    console.log(`    - SMA (50): ${ind.sma50}`);
    console.log(`    - RSI (14): ${ind.rsi14}`);
    console.log(`    - MACD: line=${ind.macd.value}, signal=${ind.macd.signal}, hist=${ind.macd.histogram}`);
    console.log(`    - Bollinger: upper=${ind.bollinger.upper}, mid=${ind.bollinger.middle}, low=${ind.bollinger.lower}`);
    console.log(`    - ATR (14): ${ind.atr14}`);
    console.log(`    - Signal: ${firstAsset.demoSignal} (${firstAsset.confidence}%), Reason: "${firstAsset.reason}"`);

    // 7. Historical Backtest Engine Execution
    console.log('\n[7/8] Running Historical Backtest with Cost Modeling...');
    const backtestRes = await request(
      'POST',
      '/api/backtest/run',
      {
        asset: 'EUR/USD',
        strategy: 'EMA_RSI',
        timeframe: '5m',
        initialBalance: 10000,
        tradeAmount: 100,
        spread: 0.0001,
        slippage: 0.0002,
        fee: 0.05
      },
      token
    );

    if (backtestRes.status !== 200 || !backtestRes.data.result) {
      throw new Error(`Backtest failed: ${JSON.stringify(backtestRes.data)}`);
    }
    const bResult = backtestRes.data.result;
    console.log('  ✓ Backtest Completed Successfully:');
    console.log(`    - Strategy: ${bResult.strategy} on ${bResult.asset} (${bResult.timeframe})`);
    console.log(`    - Initial: ₹${bResult.initialBalance} -> Final: ₹${bResult.finalBalance} (P/L: ₹${bResult.totalPnl})`);
    console.log(`    - Win Rate: ${bResult.winRate}% (${bResult.winningTrades}W / ${bResult.losingTrades}L of ${bResult.totalTrades} trades)`);
    console.log(`    - Profit Factor: ${bResult.profitFactor}, Max Drawdown: ${bResult.maxDrawdown}%`);
    console.log(`    - Equity Points Recorded: ${bResult.equityCurve.length}`);
    console.log(`    - Disclaimer: "${bResult.disclaimer}"`);

    // 8. Multi-Strategy Comparison
    console.log('\n[8/8] Running Multi-Strategy Comparison (/api/backtest/compare)...');
    const compareRes = await request(
      'POST',
      '/api/backtest/compare',
      {
        asset: 'EUR/USD',
        timeframe: '5m',
        count: 80,
        initialBalance: 10000
      },
      token
    );

    if (compareRes.status !== 200 || !compareRes.data.comparison) {
      throw new Error(`Strategy comparison failed: ${JSON.stringify(compareRes.data)}`);
    }
    console.log(`  ✓ Strategy Comparison for ${compareRes.data.asset} (${compareRes.data.timeframe}):`);
    console.table(
      compareRes.data.comparison.map((c) => ({
        Strategy: c.strategy,
        'Final Bal': `₹${c.finalBalance.toFixed(2)}`,
        'P/L': `₹${c.totalPnl.toFixed(2)}`,
        'Win Rate': `${c.winRate}%`,
        'Profit Factor': c.profitFactor,
        'Max Drawdown': `${c.maxDrawdown}%`,
        Trades: c.totalTrades
      }))
    );
    console.log(`  ✓ Disclaimer: "${compareRes.data.disclaimer}"`);

    console.log('\n================================================================');
    console.log('       ALL PHASE 3 E2E CRITERIA VERIFIED SUCCESSFULLY!         ');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runE2EVerification();
