import { experimentTimelineService } from '../src/services/research/experimentTimeline.service';

describe('Experiment Timeline Service Tests', () => {
  const expId = `EXP_TEST_${Date.now()}`;

  it('records chronological timeline events with monotonic sequence numbers', async () => {
    const e1 = await experimentTimelineService.recordEvent({
      experimentId: expId,
      eventType: 'SIGNAL',
      title: 'EMA_RSI Bullish Crossover',
      details: { price: 64500, direction: 'BUY' }
    });

    const e2 = await experimentTimelineService.recordEvent({
      experimentId: expId,
      eventType: 'TRADE',
      title: 'Executed Simulated BUY EUR/USD',
      details: { amount: 500, entry: 1.0850 }
    });

    const e3 = await experimentTimelineService.recordEvent({
      experimentId: expId,
      eventType: 'STRATEGY_THROTTLED',
      title: 'Risk throttled to 75% due to moderate drift',
      details: { multiplier: 0.75 }
    });

    expect(e1.sequence).toBe(1);
    expect(e2.sequence).toBe(2);
    expect(e3.sequence).toBe(3);
  });

  it('retrieves and strictly sorts timeline by timestamp and sequence', async () => {
    const timeline = await experimentTimelineService.getTimeline(expId);
    expect(timeline.length).toBeGreaterThanOrEqual(3);

    for (let i = 1; i < timeline.length; i++) {
      const prev = new Date(timeline[i - 1].timestamp).getTime();
      const curr = new Date(timeline[i].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
