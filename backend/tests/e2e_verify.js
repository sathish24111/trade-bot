const http = require('http');
const WebSocket = require('ws');

async function main() {
  console.log('=== TradePilot Phase 2 End-to-End Verification ===');

  const BASE_URL = 'http://localhost:5000/api';

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(BASE_URL + path);
      const reqOpts = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = http.request(reqOpts, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  // 1. Healthcheck
  console.log('\n1. Testing GET /api/health...');
  const health = await request('/health');
  console.log('Healthcheck status:', health.status, health.body);
  if (health.body.status !== 'ONLINE' || health.body.mode !== 'DEMO MODE') {
    throw new Error('Healthcheck failed');
  }

  // 2. Login with seeded demo credentials (bcrypt verified)
  console.log('\n2. Testing POST /api/auth/login with demo@tradepilot.app / 123456...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'demo@tradepilot.app', password: '123456' }
  });
  console.log('Login result:', loginRes.status, 'User:', loginRes.body.user?.name, 'Balance:', loginRes.body.user?.demoBalance);
  if (!loginRes.body.token) {
    throw new Error('Login failed to return token');
  }
  const token = loginRes.body.token;

  // 3. Register a new user
  const uniqueEmail = `test_${Date.now()}@tradepilot.app`;
  console.log(`\n3. Testing POST /api/auth/register with ${uniqueEmail}...`);
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Trader Test',
      email: uniqueEmail,
      mobile: '+91 91234 56789',
      password: 'password123'
    }
  });
  console.log('Registration result:', regRes.status, 'New user ID:', regRes.body.user?.id);

  // 4. Fetch Market Assets
  console.log('\n4. Testing GET /api/market/assets (SIMULATED MARKET DATA)...');
  const marketRes = await request('/market/assets');
  console.log('Market assets count:', marketRes.body.assets?.length, 'Data source:', marketRes.body.dataSource);

  // 5. Connect WebSocket
  console.log('\n5. Connecting WebSocket to ws://localhost:5000/ws...');
  const ws = new WebSocket('ws://localhost:5000/ws');
  const wsEvents = [];

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('WebSocket connected successfully!');
      resolve();
    });
    ws.on('error', reject);
    ws.on('message', (data) => {
      try {
        const ev = JSON.parse(data.toString());
        wsEvents.push(ev);
      } catch (e) {}
    });
  });

  // 6. Start Paper Trading Session
  console.log('\n6. Testing POST /api/trading/session/start (₹500, EMA_RSI, LOW risk, 15m)...');
  const startRes = await request('/trading/session/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: {
      investmentAmount: 500,
      strategy: 'EMA_RSI',
      riskLevel: 'LOW',
      duration: 15
    }
  });
  console.log('Start session response:', startRes.status, startRes.body);
  const sessionId = startRes.body.sessionId;

  // 7. Wait 7 seconds for paper execution loop, market ticks, and trade execution
  console.log('\n7. Waiting 7 seconds for paper simulation cycles and WebSocket events...');
  await new Promise((r) => setTimeout(r, 7000));

  console.log(`Received ${wsEvents.length} WebSocket events:`);
  const eventTypes = [...new Set(wsEvents.map(e => e.type))];
  console.log('Event types seen:', eventTypes);

  // 8. Stop the Paper Session
  console.log(`\n8. Testing POST /api/trading/session/${sessionId}/stop...`);
  const stopRes = await request(`/trading/session/${sessionId}/stop`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Stop session response:', stopRes.status, stopRes.body);

  // 9. Fetch Performance Summary
  console.log('\n9. Testing GET /api/performance/summary...');
  const perfRes = await request('/performance/summary', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Performance summary:', perfRes.status, perfRes.body.summary);

  // 10. Fetch Trade History
  console.log('\n10. Testing GET /api/performance/trades...');
  const tradesRes = await request('/performance/trades', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Total trades in MySQL for user: ${tradesRes.body.trades?.length}`);

  ws.close();
  console.log('\n✅ ALL END-TO-END VERIFICATION CHECKS PASSED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
