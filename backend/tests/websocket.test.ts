import { broadcastEvent, getEventBuffer, getLastSequence } from '../src/websocket/websocket.server';

describe('WebSocket Sequence Numbering & Ring Buffer Tests', () => {
  test('increments monotonic sequence number and attaches paper safety metadata', () => {
    const seqBefore = getLastSequence();
    const event = broadcastEvent({
      type: 'MARKET_HEALTH',
      status: 'HEALTHY',
      asset: 'BTC/USD'
    });

    expect(event.sequence).toBe(seqBefore + 1);
    expect(event.mode).toBe('PAPER');
    expect(event.isRealMoney).toBe(false);
    expect(event.brokerConnected).toBe(false);
    expect(event.timestamp).toBeDefined();

    const buffer = getEventBuffer();
    expect(buffer.length).toBeGreaterThanOrEqual(1);
    expect(buffer[buffer.length - 1].sequence).toBe(event.sequence);
  });
});
