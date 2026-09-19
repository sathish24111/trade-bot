import request from 'supertest';
import { app } from '../src/app';

describe('REST API Endpoints', () => {
  test('GET /api/health returns 200 and PAPER MODE info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.mode).toBe('PAPER');
    expect(res.body.executionEngine).toBe('DEMO_PAPER_TRADING_ONLY');
  });

  test('GET /api/market/assets returns list of simulated market assets', async () => {
    const res = await request(app).get('/api/market/assets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.assets)).toBe(true);
    expect(res.body.dataSource).toBe('SIMULATED MARKET DATA');
  });

  test('GET /api/market/EUR-USD/candles returns candle array', async () => {
    const res = await request(app).get('/api/market/EUR-USD/candles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.candles)).toBe(true);
  });

  test('POST /api/auth/login rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(500); // Caught by Zod error handler
    expect(res.body.success).toBe(false);
  });
});
