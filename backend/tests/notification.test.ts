import { notificationService } from '../src/services/notifications/notification.service';

describe('Notification Service Tests', () => {
  beforeEach(() => {
    notificationService.clearCooldowns();
  });

  it('registers and retrieves device information', async () => {
    const device = await notificationService.registerDevice(1, 'TEST_DEVICE_TOKEN_123', 'ANDROID');
    expect(device.userId).toBe(1);
    expect(device.deviceToken).toBe('TEST_DEVICE_TOKEN_123');
    expect(device.platform).toBe('ANDROID');
  });

  it('respects notification preferences and category filtering', async () => {
    // Disable critical risk in preferences
    await notificationService.updatePreferences(1, { criticalRisk: false });
    const prefs = await notificationService.getPreferences(1);
    expect(prefs.criticalRisk).toBe(false);

    // Dispatch critical risk notification -> should be filtered
    const res = await notificationService.dispatchNotification({
      category: 'CRITICAL_RISK',
      title: 'Daily loss limit reached',
      body: 'Paper trade halted'
    });
    expect(res.delivered).toBe(0);

    // Re-enable critical risk
    await notificationService.updatePreferences(1, { criticalRisk: true });
    const res2 = await notificationService.dispatchNotification({
      category: 'CRITICAL_RISK',
      title: 'Daily loss limit reached',
      body: 'Paper trade halted'
    });
    expect(res2.delivered).toBeGreaterThan(0);
  });

  it('deduplicates identical notifications within cooldown window', async () => {
    const payload = {
      category: 'STRATEGY_DRIFT' as const,
      title: 'Strategy Drift Detected: EMA_RSI',
      body: 'Expectancy fell below baseline threshold'
    };

    // First dispatch succeeds
    const first = await notificationService.dispatchNotification(payload);
    expect(first.delivered).toBeGreaterThan(0);

    // Immediate second dispatch with identical title and category is suppressed
    const second = await notificationService.dispatchNotification(payload);
    expect(second.delivered).toBe(0);
  });
});
