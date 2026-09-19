import { providerFailoverService } from '../src/services/market/providerFailover.service';

describe('Provider Failover Service Tests', () => {
  afterAll(() => {
    providerFailoverService.destroy();
  });

  it('initializes with PRIMARY_WS tier and provides active health diagnostics', () => {
    const health = providerFailoverService.getHealthInfo();
    expect(health.provider).toBeDefined();
    expect(health.uptimePercent).toBeGreaterThanOrEqual(90);
    expect(health.availabilityPercent).toBeGreaterThan(50);
  });

  it('triggers failover from PRIMARY_WS to FALLBACK_REST and then to SIMULATED', async () => {
    // 1. Trigger failover to FALLBACK_REST
    await providerFailoverService.triggerFailover('PRIMARY_WS', 'FALLBACK_REST', 'Simulated WS connection dropout');
    expect(providerFailoverService.getCurrentTier()).toBe('FALLBACK_REST');
    expect(providerFailoverService.getHealthInfo().fallbackActive).toBe(true);

    // 2. Trigger failover to SIMULATED
    await providerFailoverService.triggerFailover('FALLBACK_REST', 'SIMULATED', 'Simulated REST API rate limit breach');
    expect(providerFailoverService.getCurrentTier()).toBe('SIMULATED');

    // 3. Verify quote fallback still functions normally
    const quote = await providerFailoverService.getQuote('BTC/USD');
    expect(quote.price).toBeGreaterThan(0);
  });

  it('recovers primary provider back to PRIMARY_WS seamlessly', async () => {
    const recovered = await providerFailoverService.recoverPrimary();
    expect(recovered).toBe(true);
    expect(providerFailoverService.getCurrentTier()).toBe('PRIMARY_WS');
    expect(providerFailoverService.getHealthInfo().fallbackActive).toBe(false);
  });
});
