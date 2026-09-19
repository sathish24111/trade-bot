import { researchRecommendationService } from '../src/services/research/researchRecommendation.service';

describe('Phase 9 Research Recommendations Test Suite', () => {
  test('Evaluates trigger and generates structured research recommendation', async () => {
    const rec = await researchRecommendationService.evaluateTrigger({
      trigger: 'SIGNIFICANT_DRIFT',
      reason: 'Win rate dropped by 22% in last 20 rolling paper trades',
      evidence: 'Observed drift percentage = 22.4%',
      suggestedJob: 'WALK_FORWARD',
      parameters: { strategy: 'EMA_RSI' }
    });

    expect(rec).toBeDefined();
    expect(rec.id).toBeDefined();
    expect(rec.trigger).toBe('SIGNIFICANT_DRIFT');
    expect(rec.priority).toBe('HIGH');
    expect(rec.status).toBe('PENDING');
    expect(rec.suggestedResearchJob).toBe('WALK_FORWARD');
  });

  test('Lists recommendations and executes/dismisses an action', async () => {
    const rec = await researchRecommendationService.evaluateTrigger({
      trigger: 'PARAMETER_CLIFF',
      reason: 'Parameter neighbor performance collapsed > 30%',
      evidence: 'Cliff drop at EMA 26',
      suggestedJob: 'PARAMETER_STABILITY'
    });

    const list = await researchRecommendationService.listRecommendations();
    expect(list.length).toBeGreaterThan(0);

    const dismissed = await researchRecommendationService.dismissRecommendation(rec.id);
    expect(dismissed).toBe(true);
  });
});
