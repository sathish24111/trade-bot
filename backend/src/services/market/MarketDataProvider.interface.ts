import { Candle, MarketAsset, MarketQuote } from '../../models/MarketData';

export interface IMarketDataProvider {
  readonly name: string;
  supportsAsset(symbol: string): boolean;
  getQuote(symbol: string, timeframe?: string): Promise<MarketQuote>;
  getCandles(symbol: string, timeframe?: string, count?: number): Promise<Candle[]>;
  getAllAssets(): Promise<MarketAsset[]>;
  getAsset(symbol: string, timeframe?: string): Promise<MarketAsset | null>;
  tick?(): MarketAsset[];
}
