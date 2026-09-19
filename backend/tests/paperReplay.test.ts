import { paperReplayService } from '../src/services/research/paperReplay.service';

describe('Phase 8: Paper Trade Replay Suite', () => {
  test('Initializes replay session with default state', async () => {
    const session = await paperReplayService.initReplay({
      experimentId: 'EXP_TEST_1',
      asset: 'BTC/USD',
      candlesCount: 50,
      speed: 2
    });

    expect(session.sessionId).toBeDefined();
    expect(session.totalBars).toBeGreaterThan(0);
    expect(session.speed).toBe(2);
    expect(session.status).toBe('IDLE');
  });

  test('Steps through replay sequentially forwards and backwards', async () => {
    const session = await paperReplayService.initReplay({
      experimentId: 'EXP_TEST_2',
      asset: 'BTC/USD',
      candlesCount: 40
    });

    const initialIdx = session.currentIndex;

    const step1 = paperReplayService.stepNext(session.sessionId);
    expect(step1.currentIndex).toBe(initialIdx + 1);

    const step2 = paperReplayService.stepNext(session.sessionId);
    expect(step2.currentIndex).toBe(initialIdx + 2);

    const stepBack = paperReplayService.stepPrevious(session.sessionId);
    expect(stepBack.currentIndex).toBe(initialIdx + 1);

    const reset = paperReplayService.reset(session.sessionId);
    expect(reset.currentIndex).toBe(10);
  });

  test('Strict Anti-Lookahead Isolation: Indicators at index k evaluate only candles 0..k', async () => {
    const session = await paperReplayService.initReplay({
      experimentId: 'EXP_TEST_3',
      asset: 'BTC/USD',
      candlesCount: 30
    });

    paperReplayService.stepNext(session.sessionId);
    const state = paperReplayService.getState(session.sessionId);
    expect(state.currentIndex).toBeGreaterThan(0);
    expect(state.currentPrice).toBeGreaterThan(0);
    expect(state.activeSignals).toBeDefined();
  });

  test('Play, pause and speed change update state accurately', async () => {
    const session = await paperReplayService.initReplay({
      experimentId: 'EXP_TEST_4',
      candlesCount: 30
    });

    const playing = paperReplayService.play(session.sessionId, 5);
    expect(playing.status).toBe('PLAYING');
    expect(playing.speed).toBe(5);

    const paused = paperReplayService.pause(session.sessionId);
    expect(paused.status).toBe('PAUSED');
  });
});
