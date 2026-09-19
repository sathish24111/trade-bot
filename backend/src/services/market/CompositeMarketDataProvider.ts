import { Candle, MarketAsset, MarketQuote } from '../../models/MarketData';
import { IMarketDataProvider } from './MarketDataProvider.interface';
import { MockMarketDataProvider } from './MockMarketDataProvider';
import { CryptoMarketDataProvider } from './CryptoMarketDataProvider';
import { ForexMarketDataProvider } from './ForexMarketDataProvider';
import { env } from '../../config/env';

export class CompositeMarketDataProvider implements IMarketDataProvider {
  readonly name = 'composite';
  private mockProvider: MockMarketDataProvider;
  private cryptoProvider: CryptoMarketDataProvider;
  private forexProvider: ForexMarketDataProvider;
  private mode: string;

  constructor(mode: string = env.MARKET_DATA_PROVIDER) {
    this.mode = mode;
    this.mockProvider = new MockMarketDataProvider();
    this.cryptoProvider = new CryptoMarketDataProvider();
    this.forexProvider = new ForexMarketDataProvider();
  }

  setMode(mode: 'mock' | 'live') {
    this.mode = mode;
  }

  private getProviderForAsset(symbol: string): IMarketDataProvider | null {
    if (this.mode === 'mock') {
      if (this.mockProvider.supportsAsset(symbol)) {
        return this.mockProvider;
      }
      return null;
    }

    if (this.cryptoProvider.supportsAsset(symbol)) {
      return this.cryptoProvider;
    }
    if (this.forexProvider.supportsAsset(symbol)) {
      return this.forexProvider;
    }
    return null;
  }

  supportsAsset(symbol: string): boolean {
    return this.getProviderForAsset(symbol) !== null;
  }

  async getQuote(symbol: string, timeframe = '5m'): Promise<MarketQuote> {
    const provider = this.getProviderForAsset(symbol);
    if (!provider) {
      const activeDesc = this.mode === 'mock' ? 'MockMarketDataProvider' : 'CryptoMarketDataProvider/ForexMarketDataProvider';
      throw new Error(`Asset ${symbol} is not supported by active provider (${activeDesc})`);
    }
    return provider.getQuote(symbol, timeframe);
  }

  async getCandles(symbol: string, timeframe = '5m', count = 60): Promise<Candle[]> {
    const provider = this.getProviderForAsset(symbol);
    if (!provider) {
      const activeDesc = this.mode === 'mock' ? 'MockMarketDataProvider' : 'CryptoMarketDataProvider/ForexMarketDataProvider';
      throw new Error(`Asset ${symbol} is not supported by active provider (${activeDesc})`);
    }
    return provider.getCandles(symbol, timeframe, count);
  }

  async getAllAssets(): Promise<MarketAsset[]> {
    if (this.mode === 'mock') {
      return this.mockProvider.getAllAssets();
    }
    const [cryptoAssets, forexAssets] = await Promise.all([
      this.cryptoProvider.getAllAssets(),
      this.forexProvider.getAllAssets()
    ]);
    return [...cryptoAssets, ...forexAssets];
  }

  async getAsset(symbol: string, timeframe = '5m'): Promise<MarketAsset | null> {
    const provider = this.getProviderForAsset(symbol);
    if (!provider) {
      return null;
    }
    return provider.getAsset(symbol, timeframe);
  }

  tick(): MarketAsset[] {
    return this.mockProvider.tick();
  }
}
