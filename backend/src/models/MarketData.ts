export type MarketDataStatus = 'LIVE' | 'LIVE_READ_ONLY' | 'DELAYED' | 'CACHED' | 'SIMULATED' | 'STALE' | 'DEGRADED' | 'UNAVAILABLE';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MacdResult {
  value: number;
  signal: number;
  histogram: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface TechnicalIndicators {
  ema21: number;
  sma20: number;
  sma50: number;
  rsi14: number;
  macd: MacdResult;
  bollinger: BollingerResult;
  atr14: number;
}

export type DemoSignalType = 'BUY' | 'SELL' | 'WAIT';

export interface MarketQuote {
  asset: string;
  timeframe: string;
  price: number;
  timestamp: string;
  source: string;
  isLive: boolean;
  status: MarketDataStatus;
  change24h?: number;
  changePercent?: number;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  demoSignal: DemoSignalType;
  confidence: number;
  reason: string;
  indicators: TechnicalIndicators;
  candles: Candle[];
  dataSource: string;
  status: MarketDataStatus;
  isLive: boolean;
  timeframe?: string;
}
