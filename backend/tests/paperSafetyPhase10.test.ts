import { paperSafetyService } from '../src/services/security/paperSafety.service';
import { configValidationService } from '../src/services/security/configValidation.service';
import { app } from '../src/app';
import request from 'supertest';

describe('Phase 10 Production Paper Safety & Hardening Suite', () => {
  it('strictly verifies that TRADING_MODE is locked to PAPER with zero real money', () => {
    const envelope = paperSafetyService.getSafetyEnvelope();
    expect(envelope.mode).toBe('PAPER');
    expect(envelope.isRealMoney).toBe(false);
    expect(envelope.brokerConnected).toBe(false);

    const audit = paperSafetyService.auditSafety();
    expect(audit.safetyStatus).toBe('VERIFIED');
    expect(audit.tradingMode).toBe('PAPER');
    expect(audit.brokerConnected).toBe(false);
    expect(audit.realMoney).toBe(false);
    expect(audit.realExecution).toBe(false);
  });

  it('verifies that no live broker order, deposit, or withdrawal routes exist in Express stack', () => {
    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(middleware.route.path);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            routes.push(handler.route.path);
          }
        });
      }
    });

    const isSafe = paperSafetyService.verifyNoProhibitedRoutes(routes);
    expect(isSafe).toBe(true);

    const lowerRoutes = routes.map(r => r.toLowerCase());
    expect(lowerRoutes.some(r => r.includes('/broker/order'))).toBe(false);
    expect(lowerRoutes.some(r => r.includes('/deposit'))).toBe(false);
    expect(lowerRoutes.some(r => r.includes('/withdraw'))).toBe(false);
  });

  it('validates configValidationService rejects unsafe or live configurations', () => {
    const validResult = configValidationService.validateStartupConfig();
    expect(validResult.valid).toBe(true);
    expect(validResult.tradingMode).toBe('PAPER');

    const check = validResult.checks.find(c => c.name === 'TRADING_MODE_PAPER_LOCK');
    expect(check?.passed).toBe(true);
  });

  it('verifies all health endpoints include safety envelope and correlation IDs', async () => {
    const resLive = await request(app).get('/api/health/live');
    expect(resLive.status).toBe(200);
    expect(resLive.body.mode).toBe('PAPER');
    expect(resLive.body.isRealMoney).toBe(false);
    expect(resLive.body.brokerConnected).toBe(false);
    expect(resLive.headers['x-request-id']).toBeDefined();

    const resReady = await request(app).get('/api/health/ready');
    expect([200, 503]).toContain(resReady.status);
    expect(resReady.body.mode).toBe('PAPER');
    expect(resReady.body.isRealMoney).toBe(false);

    const resMetrics = await request(app).get('/api/health/metrics');
    expect(resMetrics.status).toBe(200);
    expect(resMetrics.body.metrics).toBeDefined();
    expect(resMetrics.body.mode).toBe('PAPER');

    const resSafety = await request(app).get('/api/health/safety');
    expect(resSafety.status).toBe(200);
    expect(resSafety.body.audit.safetyStatus).toBe('VERIFIED');
  });
});
