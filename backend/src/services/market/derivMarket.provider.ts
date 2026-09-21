import WebSocket from 'ws';
import { Candle, MarketAsset, MarketQuote } from '../../models/MarketData';
import { MarketProviderState, NormalizedMarketTick } from '../../models/Phase7';
import { IMarketDataProvider } from './MarketDataProvider.interface';
import { dataQualityGate } from './dataQualityGate.service';
import { indicatorService } from '../indicator.service';

interface DerivAssetDef {
  symbol: string;        // TradePilot symbol (e.g. 'R_100' or 'EUR/USD')
  derivSymbol: string;   // Deriv native symbol (e.g. 'R_100' or 'frxEURUSD')
  name: string;
  type: 'SYNTHETIC' | 'FOREX';
  price: number;
  bid: number;
  ask: number;
  change24h: number;
  changePercent: number;
  pipSize: number;
  lastUpdated: number;
  candles: Candle[];
}

export class DerivMarketProvider implements IMarketDataProvider {
  readonly name = 'deriv-ws-public';
  private ws: WebSocket | null = null;
  private state: MarketProviderState = 'RECOVERING';
  private assets: Map<string, DerivAssetDef> = new Map();
  private derivToAppSymbol: Map<string, string> = new Map();

  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectCount = 0;
  private maxReconnectAttempts = 15;
  private backoffDelays = [1000, 2000, 3000, 5000, 10000, 20000];

  public messageCount = 0;
  public lastMessageTime = 0;
  public latencyMs = 0;
  public startTime = Date.now();
  public errorCount = 0;

  constructor() {
    this.initDefaultAssets();
    this.connect();
  }

  private initDefaultAssets() {
    const assetDefs: Omit<DerivAssetDef, 'price' | 'bid' | 'ask' | 'change24h' | 'changePercent' | 'lastUpdated' | 'candles'>[] = [
      { symbol: 'R_100', derivSymbol: 'R_100', name: 'Volatility 100 Index', type: 'SYNTHETIC', pipSize: 2 },
      { symbol: 'R_50', derivSymbol: 'R_50', name: 'Volatility 50 Index', type: 'SYNTHETIC', pipSize: 2 },
      { symbol: 'R_25', derivSymbol: 'R_25', name: 'Volatility 25 Index', type: 'SYNTHETIC', pipSize: 2 },
      { symbol: '1HZ100V', derivSymbol: '1HZ100V', name: 'Volatility 100 (1s) Index', type: 'SYNTHETIC', pipSize: 2 },
      { symbol: 'EUR/USD', derivSymbol: 'frxEURUSD', name: 'EUR / USD Forex', type: 'FOREX', pipSize: 5 },
      { symbol: 'GBP/USD', derivSymbol: 'frxGBPUSD', name: 'GBP / USD Forex', type: 'FOREX', pipSize: 5 }
    ];

    const initialPrices: Record<string, number> = {
      'R_100': 585.0,
      'R_50': 290.0,
      'R_25': 1800.0,
      '1HZ100V': 620.0,
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2950
    };

    const now = Date.now();
    for (const def of assetDefs) {
      const p = initialPrices[def.symbol] || 100.0;
      const candles: Candle[] = [];
      for (let i = 59; i >= 0; i--) {
        const time = now - i * 60000;
        const cp = p * (1 + (Math.random() - 0.5) * 0.004);
        candles.push({
          timestamp: time,
          open: cp * 0.999,
          high: cp * 1.002,
          low: cp * 0.998,
          close: cp,
          volume: Math.floor(50 + Math.random() * 200)
        });
      }

      this.assets.set(def.symbol, {
        ...def,
        price: p,
        bid: p * 0.9998,
        ask: p * 1.0002,
        change24h: 0,
        changePercent: 0,
        lastUpdated: now,
        candles
      });

      this.derivToAppSymbol.set(def.derivSymbol, def.symbol);
    }
  }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    try {
      const url = 'wss://api.derivws.com/trading/v1/options/ws/public';
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.reconnectCount = 0;
        this.state = 'HEALTHY';
        console.log(`[DerivWS] Connected to Deriv Public WebSocket: ${url}`);

        this.startHeartbeat();
        this.subscribeToAllTicks();
      });

      this.ws.on('message', (raw: WebSocket.RawData) => {
        this.handleMessage(raw);
      });

      this.ws.on('error', (err: Error) => {
        this.errorCount++;
        console.warn(`[DerivWS] WebSocket error: ${err.message}`);
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        this.state = 'DEGRADED';
        this.cleanupHeartbeat();
        this.scheduleReconnect();
      });
    } catch (err: any) {
      this.isConnecting = false;
      this.errorCount++;
      this.scheduleReconnect();
    }
  }

  private subscribeToAllTicks() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    for (const asset of this.assets.values()) {
      try {
        this.ws.send(JSON.stringify({ ticks: asset.derivSymbol }));
      } catch {
        // ignore send error
      }
    }
  }

  private startHeartbeat() {
    this.cleanupHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const start = Date.now();
          this.ws.send(JSON.stringify({ ping: 1 }));
          this.latencyMs = Date.now() - start;
        } catch {
          // ignore
        }
      }
    }, 30000);
  }

  private cleanupHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = this.backoffDelays[Math.min(this.reconnectCount, this.backoffDelays.length - 1)];
    this.reconnectCount++;
    console.log(`[DerivWS] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(raw: WebSocket.RawData) {
    try {
      this.messageCount++;
      this.lastMessageTime = Date.now();
      const msg = JSON.parse(raw.toString());

      if (msg.msg_type === 'ping') return;

      if (msg.msg_type === 'tick' && msg.tick) {
        const t = msg.tick;
        const appSymbol = this.derivToAppSymbol.get(t.symbol);
        if (appSymbol && this.assets.has(appSymbol)) {
          const asset = this.assets.get(appSymbol)!;
          const oldPrice = asset.price;
          const newPrice = parseFloat(t.quote);
          const bid = parseFloat(t.bid || t.quote);
          const ask = parseFloat(t.ask || t.quote);
          const timestamp = t.epoch ? t.epoch * 1000 : Date.now();

          const openPrice = asset.candles.length > 0 ? asset.candles[0].open : newPrice;
          const change = newPrice - openPrice;
          const changePercent = openPrice > 0 ? (change / openPrice) * 100 : 0;

          asset.price = newPrice;
          asset.bid = bid;
          asset.ask = ask;
          asset.change24h = parseFloat(change.toFixed(asset.pipSize));
          asset.changePercent = parseFloat(changePercent.toFixed(2));
          asset.lastUpdated = timestamp;

          // Update latest candle
          const lastCandle = asset.candles[asset.candles.length - 1];
          if (lastCandle && timestamp - lastCandle.timestamp < 60000) {
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
            lastCandle.close = newPrice;
            lastCandle.volume = (lastCandle.volume || 0) + 1;
          } else {
            asset.candles.push({
              timestamp: Math.floor(timestamp / 60000) * 60000,
              open: oldPrice,
              high: Math.max(oldPrice, newPrice),
              low: Math.min(oldPrice, newPrice),
              close: newPrice,
              volume: 1
            });
            if (asset.candles.length > 300) {
              asset.candles.shift();
            }
          }

          // Data quality validation
          const tickData: NormalizedMarketTick = {
            asset: appSymbol,
            price: newPrice,
            bid,
            ask,
            volume: 1,
            timestamp,
            provider: this.name,
            status: this.state === 'HEALTHY' ? 'LIVE_READ_ONLY' : 'DELAYED',
            isLive: this.state === 'HEALTHY'
          };
          dataQualityGate.validateTick(tickData);
        }
      }
    } catch {
      // ignore
    }
  }

  supportsAsset(symbol: string): boolean {
    const clean = symbol.toUpperCase().replace('-', '/');
    return this.assets.has(clean) || this.derivToAppSymbol.has(symbol);
  }

  async getQuote(symbol: string, timeframe = '5m'): Promise<MarketQuote> {
    const clean = symbol.toUpperCase().replace('-', '/');
    const asset = this.assets.get(clean);
    if (!asset) {
      throw new Error(`Asset ${symbol} is not supported by DerivMarketProvider`);
    }

    const isLive = this.state === 'HEALTHY' || (Date.now() - asset.lastUpdated < 120000);
    return {
      asset: clean,
      timeframe,
      price: asset.price,
      timestamp: new Date(asset.lastUpdated).toISOString(),
      source: 'LIVE READ-ONLY DATA (Deriv Public WS)',
      isLive,
      status: isLive ? 'LIVE_READ_ONLY' : 'DEGRADED',
      change24h: asset.change24h,
      changePercent: asset.changePercent
    };
  }

  async getCandles(symbol: string, timeframe = '5m', count = 60): Promise<Candle[]> {
    const clean = symbol.toUpperCase().replace('-', '/');
    const asset = this.assets.get(clean);
    if (!asset) {
      throw new Error(`Asset ${symbol} is not supported by DerivMarketProvider`);
    }
    return asset.candles.slice(-count);
  }

  async getAllAssets(): Promise<MarketAsset[]> {
    const results: MarketAsset[] = [];
    for (const [_, asset] of this.assets.entries()) {
      const indicators = indicatorService.calculateAllIndicators(asset.candles);
      results.push({
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        change24h: asset.change24h,
        changePercent: asset.changePercent,
        trend: indicators.ema21 > indicators.sma50 ? 'BULLISH' : 'BEARISH',
        demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
        confidence: 90,
        reason: 'Deriv Public WS Feed',
        indicators,
        candles: asset.candles,
        dataSource: 'LIVE READ-ONLY DATA (Deriv WS)',
        status: this.state === 'HEALTHY' ? 'LIVE_READ_ONLY' : 'DEGRADED',
        isLive: this.state === 'HEALTHY'
      });
    }
    return results;
  }

  async getAsset(symbol: string, timeframe = '5m'): Promise<MarketAsset | null> {
    const clean = symbol.toUpperCase().replace('-', '/');
    const asset = this.assets.get(clean);
    if (!asset) return null;

    const indicators = indicatorService.calculateAllIndicators(asset.candles);
    return {
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      change24h: asset.change24h,
      changePercent: asset.changePercent,
      trend: indicators.ema21 > indicators.sma50 ? 'BULLISH' : 'BEARISH',
      demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
      confidence: 90,
      reason: 'Deriv Public WS Feed',
      indicators,
      candles: asset.candles,
      dataSource: 'LIVE READ-ONLY DATA (Deriv WS)',
      status: this.state === 'HEALTHY' ? 'LIVE_READ_ONLY' : 'DEGRADED',
      isLive: this.state === 'HEALTHY',
      timeframe
    };
  }

  public getStatus() {
    return {
      name: this.name,
      state: this.state,
      connected: this.ws !== null && this.ws.readyState === WebSocket.OPEN,
      assetsTracked: this.assets.size,
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime ? new Date(this.lastMessageTime).toISOString() : null,
      latencyMs: this.latencyMs,
      errorCount: this.errorCount,
      supportedSymbols: Array.from(this.assets.keys())
    };
  }
}

export const derivMarketProvider = new DerivMarketProvider();
