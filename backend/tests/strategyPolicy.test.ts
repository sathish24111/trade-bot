import { strategyPolicyService } from '../src/services/strategy/strategyPolicy.service';

describe('Adaptive Strategy Policy Service Tests', () => {
  it('loads default policy configurations for standard strategies', async () => {
    const policy = await strategyPolicyService.getPolicy('EMA_RSI');
    expect(policy.strategyId).toBe('EMA_RSI');
    expect(policy.throttleRules.watchRiskMultiplier).toBe(0.75);
    expect(policy.throttleRules.significantRiskMultiplier).toBe(0.50);
  });

  it('evaluates WATCH drift and applies 75% risk throttle', async () => {
    const evalRes = await strategyPolicyService.evaluateStrategy({
      strategyId: 'EMA_RSI',
      driftClassification: 'WATCH',
      expectancyDropPct: 0.08
    });
    expect(evalRes.action).toBe('THROTTLE');
    expect(evalRes.riskMultiplier).toBe(0.75);
  });

  it('evaluates SIGNIFICANT drift and applies 50% risk throttle', async () => {
    const evalRes = await strategyPolicyService.evaluateStrategy({
      strategyId: 'EMA_RSI',
      driftClassification: 'SIGNIFICANT',
      expectancyDropPct: 0.18
    });
    expect(evalRes.action).toBe('THROTTLE');
    expect(evalRes.riskMultiplier).toBe(0.50);
  });

  it('evaluates CRITICAL drift and triggers automatic pause', async () => {
    const evalRes = await strategyPolicyService.evaluateStrategy({
      strategyId: 'EMA_RSI',
      driftClassification: 'CRITICAL',
      expectancyDropPct: 0.35,
      currentState: 'enabled'
    });
    expect(evalRes.action).toBe('PAUSE');
    expect(evalRes.riskMultiplier).toBe(0.0);

    // Verify recorded adaptation history
    const history = await strategyPolicyService.getAdaptationHistory('EMA_RSI');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].newState).toBe('paused');
  });

  it('enforces recovery conditions and allows manual resume override', async () => {
    // Attempt recovery without observation window or manual approval -> fails
    const failRes = await strategyPolicyService.attemptRecovery('EMA_RSI', {
      bypassObservation: false,
      manualApproval: false
    });
    expect(failRes.recovered).toBe(false);

    // Manual user approval override -> succeeds
    const successRes = await strategyPolicyService.attemptRecovery('EMA_RSI', {
      manualApproval: true,
      bypassObservation: true
    });
    expect(successRes.recovered).toBe(true);
  });
});
