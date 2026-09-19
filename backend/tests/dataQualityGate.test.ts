import { dataQualityGate } from '../src/services/market/dataQualityGate.service';
import { NormalizedMarketTick } from '../src/models/Phase7';
import { Candle } from '../src/models/MarketData';

describe('Data Quality Gate Tests', () => {
  beforeEach(() => {
    dataQualityGate.reset();
  });

  it('accepts valid market tick with correct timestamp and price', () => {
    const tick: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: Date.now() - 1000,
      price: 64500.25,
      bid: 64500.00,
      ask: 64500.50,
      volume: 1.25,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const res = dataQualityGate.validateTick(tick);
    expect(res.isValid).toBe(true);
    expect(res.priceOk).toBe(true);
    expect(res.timestampOk).toBe(true);
  });

  it('rejects tick with non-positive or invalid price', () => {
    const badTick: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: Date.now(),
      price: -100,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const res = dataQualityGate.validateTick(badTick);
    expect(res.isValid).toBe(false);
    expect(res.priceOk).toBe(false);
  });

  it('rejects duplicate ticks with identical timestamp and price', () => {
    const now = Date.now();
    const tick1: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: now,
      price: 64000.0,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const tick2: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: now,
      price: 64000.0,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const res1 = dataQualityGate.validateTick(tick1);
    expect(res1.isValid).toBe(true);

    const res2 = dataQualityGate.validateTick(tick2);
    expect(res2.isValid).toBe(false);
    expect(res2.duplicate).toBe(true);
  });

  it('rejects out-of-order timestamp sequence', () => {
    const now = Date.now();
    const tick1: NormalizedMarketTick = {
      asset: 'ETH/USD',
      timestamp: now,
      price: 3500.0,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const tick2: NormalizedMarketTick = {
      asset: 'ETH/USD',
      timestamp: now - 5000, // in past
      price: 3505.0,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    dataQualityGate.validateTick(tick1);
    const res2 = dataQualityGate.validateTick(tick2);
    expect(res2.isValid).toBe(false);
    expect(res2.sequenceOk).toBe(false);
  });

  it('detects abnormal price jump > 20%', () => {
    const now = Date.now();
    const tick1: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: now,
      price: 60000.0,
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    const tick2: NormalizedMarketTick = {
      asset: 'BTC/USD',
      timestamp: now + 1000,
      price: 75000.0, // +25% jump!
      provider: 'crypto-ws-public',
      status: 'LIVE_READ_ONLY',
      isLive: true
    };

    dataQualityGate.validateTick(tick1);
    const res2 = dataQualityGate.validateTick(tick2);
    expect(res2.isValid).toBe(false);
    expect(res2.abnormalJump).toBe(true);
  });

  it('validates OHLC consistency for candles', () => {
    const now = Date.now();
    const validCandle: Candle = {
      timestamp: now,
      open: 100.0,
      high: 105.0,
      low: 98.0,
      close: 102.0,
      volume: 10
    };

    const res = dataQualityGate.validateCandle('BTC/USD', validCandle);
    expect(res.isValid).toBe(true);
    expect(res.ohlcOk).toBe(true);

    // Corrupted OHLC where Low > High
    const corruptedCandle: Candle = {
      timestamp: now,
      open: 100.0,
      high: 95.0,
      low: 110.0,
      close: 102.0,
      volume: 10
    };

    const badRes = dataQualityGate.validateCandle('BTC/USD', corruptedCandle);
    expect(badRes.isValid).toBe(false);
    expect(badRes.ohlcOk).toBe(false);
  });
});
