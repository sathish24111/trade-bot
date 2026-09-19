import { strategyControlService } from '../src/services/monitoring/strategyControl.service';

describe('Strategy Enable/Disable Controls & Audit Log Tests', () => {
  test('updates strategy state and logs audit record', async () => {
    const updated = await strategyControlService.setStrategyState(
      'MACD',
      'disabled',
      'Temporarily paused due to elevated market volatility',
      1
    );

    expect(updated.strategy).toBe('MACD');
    expect(updated.state).toBe('disabled');
    expect(strategyControlService.isSignalGenerationAllowed('MACD')).toBe(false);

    // Re-enable strategy
    const reEnabled = await strategyControlService.setStrategyState('MACD', 'enabled', 'Re-enabled by user', 1);
    expect(reEnabled.state).toBe('enabled');
    expect(strategyControlService.isSignalGenerationAllowed('MACD')).toBe(true);
  });
});
