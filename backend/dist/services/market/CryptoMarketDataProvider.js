"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoMarketDataProvider = void 0;
const indicator_service_1 = require("../indicator.service");
class CryptoMarketDataProvider {
    name = 'crypto-binance';
    supported = [
        { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', binancePair: 'BTCUSDT', defaultPrice: 64500 },
        { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', binancePair: 'ETHUSDT', defaultPrice: 3450 }
    ];
    cache = new Map();
    supportsAsset(symbol) {
        const clean = symbol.toUpperCase().replace('-', '/');
        return this.supported.some(s => s.symbol === clean || s.binancePair === symbol.toUpperCase());
    }
    mapTimeframe(tf) {
        switch (tf) {
            case '1m': return '1m';
            case '5m': return '5m';
            case '15m': return '15m';
            case '1h': return '1h';
            case '4h': return '4h';
            case '1D': return '1d';
            default: return '5m';
        }
    }
    async getQuote(symbol, timeframe = '5m') {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by CryptoMarketDataProvider`);
        }
        return {
            asset: asset.symbol,
            timeframe,
            price: asset.price,
            timestamp: new Date().toISOString(),
            source: asset.dataSource,
            isLive: asset.isLive,
            status: asset.status,
            change24h: asset.change24h,
            changePercent: asset.changePercent
        };
    }
    async getCandles(symbol, timeframe = '5m', count = 60) {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by CryptoMarketDataProvider`);
        }
        return asset.candles.slice(-count);
    }
    async getAllAssets() {
        const results = [];
        for (const def of this.supported) {
            const asset = await this.getAsset(def.symbol);
            if (asset)
                results.push(asset);
        }
        return results;
    }
    async getAsset(symbol, timeframe = '5m') {
        const clean = symbol.toUpperCase().replace('-', '/');
        const def = this.supported.find(s => s.symbol === clean || s.binancePair === symbol.toUpperCase());
        if (!def) {
            return null;
        }
        try {
            const interval = this.mapTimeframe(timeframe);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const [tickerRes, klinesRes] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${def.binancePair}`, { signal: controller.signal }),
                fetch(`https://api.binance.com/api/v3/klines?symbol=${def.binancePair}&interval=${interval}&limit=60`, { signal: controller.signal })
            ]);
            clearTimeout(timeoutId);
            if (tickerRes.ok && klinesRes.ok) {
                const ticker = await tickerRes.json();
                const klines = await klinesRes.json();
                const candles = klines.map((k) => ({
                    timestamp: Number(k[0]),
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4]),
                    volume: parseFloat(k[5])
                }));
                const currentPrice = parseFloat(ticker.lastPrice);
                const change24h = parseFloat(ticker.priceChange);
                const changePercent = parseFloat(ticker.priceChangePercent);
                const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
                const asset = {
                    symbol: def.symbol,
                    name: def.name,
                    price: currentPrice,
                    change24h,
                    changePercent,
                    trend: changePercent >= 0 ? 'BULLISH' : 'BEARISH',
                    demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
                    confidence: Math.min(85, Math.max(50, Math.round(50 + Math.abs(50 - indicators.rsi14)))),
                    reason: `Real-time Binance feed: RSI=${indicators.rsi14}, EMA21=${indicators.ema21}`,
                    indicators,
                    candles,
                    dataSource: 'binance-public',
                    status: 'LIVE',
                    isLive: true,
                    timeframe
                };
                this.cache.set(def.symbol, asset);
                return asset;
            }
        }
        catch {
            // Fetch failed or timed out — fallback to cached or simulated
        }
        // Fallback: If we have cached data, return as CACHED (NOT LIVE)
        const cached = this.cache.get(def.symbol);
        if (cached) {
            return {
                ...cached,
                status: 'CACHED',
                isLive: false,
                dataSource: 'binance-public (cached)',
                timeframe
            };
        }
        // If no cache, return simulated fallback
        return this.createSimulatedFallback(def, timeframe);
    }
    createSimulatedFallback(def, timeframe) {
        const candles = [];
        let price = def.defaultPrice;
        const now = Date.now();
        for (let i = 0; i < 60; i++) {
            const open = price;
            const change = (Math.random() - 0.49) * (price * 0.005);
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * (price * 0.002);
            const low = Math.min(open, close) - Math.random() * (price * 0.002);
            candles.push({ timestamp: now - (60 - i) * 300000, open, high, low, close, volume: 100 });
            price = close;
        }
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
        return {
            symbol: def.symbol,
            name: def.name,
            price,
            change24h: 0,
            changePercent: 0,
            trend: 'NEUTRAL',
            demoSignal: 'WAIT',
            confidence: 50,
            reason: 'Network unreachable: simulated fallback data',
            indicators,
            candles,
            dataSource: 'crypto-offline-fallback',
            status: 'SIMULATED',
            isLive: false,
            timeframe
        };
    }
}
exports.CryptoMarketDataProvider = CryptoMarketDataProvider;
