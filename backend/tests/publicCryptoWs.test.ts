import { publicCryptoWsProvider } from '../src/services/market/publicCryptoWs.provider';

describe('Public Crypto WebSocket Provider Tests', () => {
  beforeEach(() => {
    publicCryptoWsProvider.setState('HEALTHY');
  });

  afterEach(() => {
    publicCryptoWsProvider.disconnect();
  });

  it('supports major crypto assets', () => {
    expect(publicCryptoWsProvider.supportsAsset('BTC/USD')).toBe(true);
    expect(publicCryptoWsProvider.supportsAsset('ETH/USD')).toBe(true);
    expect(publicCryptoWsProvider.supportsAsset('XYZ/USD')).toBe(false);
  });

  it('normalizes incoming raw ticker message accurately into LIVE_READ_ONLY tick', (done) => {
    const rawTicker = {
      s: 'BTCUSDT',
      c: '65432.10',
      b: '65430.00',
      a: '65434.00',
      v: '120.45',
      p: '150.00',
      P: '2.35',
      E: Date.now()
    };

    publicCryptoWsProvider.onTick((tick) => {
      expect(tick.asset).toBe('BTC/USD');
      expect(tick.price).toBe(65432.10);
      expect(tick.bid).toBe(65430.00);
      expect(tick.ask).toBe(65434.00);
      expect(tick.provider).toBe('crypto-ws-public');
      expect(tick.status).toBe('LIVE_READ_ONLY');
      expect(tick.isLive).toBe(true);
      done();
    });

    publicCryptoWsProvider.handleIncomingMessage(rawTicker);
  });

  it('returns valid market quote with LIVE READ-ONLY source label', async () => {
    const quote = await publicCryptoWsProvider.getQuote('BTC/USD');
    expect(quote.asset).toBe('BTC/USD');
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.source).toContain('LIVE READ-ONLY DATA');
    expect(quote.status).toBe('LIVE_READ_ONLY');
  });

  it('provides required 60 candles with OHLC consistency', async () => {
    const candles = await publicCryptoWsProvider.getCandles('BTC/USD', '5m', 60);
    expect(candles.length).toBe(60);
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
    }
  });
});
