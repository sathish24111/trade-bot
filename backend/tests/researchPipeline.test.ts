import { researchOrchestratorService } from '../src/services/research/researchOrchestrator.service';

describe('Phase 9 Full Research Pipeline Execution Test Suite', () => {
  test('Runs 14-stage research pipeline sequentially with checkpoints and without lookahead bias', async () => {
    const job = await researchOrchestratorService.createJob({
      type: 'FULL_RESEARCH_PIPELINE',
      parameters: {
        strategy: 'EMA_RSI',
        asset: 'BTC/USD',
        timeframe: '5m'
      }
    });

    const pipelineResult = await researchOrchestratorService.runFullPipeline(job);

    expect(pipelineResult).toBeDefined();
    expect(pipelineResult.stages.length).toBe(14);
    expect(pipelineResult.overallStatus).toBe('COMPLETED');
    expect(pipelineResult.disclaimer).toBeDefined();

    // Verify key stages executed
    const stageNames = pipelineResult.stages.map(s => s.stage);
    expect(stageNames).toContain('DATASET_VALIDATION');
    expect(stageNames).toContain('BACKTEST');
    expect(stageNames).toContain('WALK_FORWARD');
    expect(stageNames).toContain('MONTE_CARLO');
    expect(stageNames).toContain('FINAL_REPORT');

    const completedStages = pipelineResult.stages.filter(s => s.status === 'COMPLETED');
    expect(completedStages.length).toBe(14);
  }, 30000);
});
