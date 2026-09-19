import { env } from '../src/config/env';
import { MockMarketDataProvider } from '../src/services/market/MockMarketDataProvider';
import { CompositeMarketDataProvider } from '../src/services/market/CompositeMarketDataProvider';

describe('Safety Guardrails & Kill Switch Tests', () => {
  test('TRADING_MODE is strictly locked to PAPER', () => {
    expect(env.TRADING_MODE).toBe('PAPER');
  });

  test('MockMarketDataProvider quotes always report isLive: false and status: SIMULATED', async () => {
    const provider = new MockMarketDataProvider();
    const quote = await provider.getQuote('EUR/USD');

    expect(quote.isLive).toBe(false);
    expect(quote.status).toBe('SIMULATED');
    expect(quote.source).toBe('mock');
  });

  test('Unsupported asset throws explicit error detailing provider failure', async () => {
    const composite = new CompositeMarketDataProvider('mock');
    await expect(composite.getQuote('UNKNOWN_COIN/USD')).rejects.toThrow(
      /Asset UNKNOWN_COIN\/USD is not supported/
    );
  });
});
