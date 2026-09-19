"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMarketDataProvider = void 0;
const indicator_service_1 = require("../indicator.service");
class MockMarketDataProvider {
    name = 'mock';
    assets = new Map();
    defaultDefinitions = [
        { symbol: 'EUR/USD', name: 'Euro / US Dollar', basePrice: 1.08245, variance: 0.0006 },
        { symbol: 'GBP/USD', name: 'British Pound / US Dollar', basePrice: 1.26420, variance: 0.0010 },
        { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', basePrice: 154.350, variance: 0.35 },
        { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', basePrice: 64320.00, variance: 650.0 },
        { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', basePrice: 3465.50, variance: 35.0 }
    ];
    constructor() {
        this.initDefaultAssets();
    }
    initDefaultAssets() {
        for (const def of this.defaultDefinitions) {
            const candles = this.generateCandles(def.basePrice, def.variance, 150);
            const lastCandle = candles[candles.length - 1];
            const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
            const asset = {
                symbol: def.symbol,
                name: def.name,
                price: lastCandle.close,
                change24h: Number((lastCandle.close - candles[0].open).toFixed(5)),
                changePercent: Number((((lastCandle.close - candles[0].open) / candles[0].open) * 100).toFixed(2)),
                trend: lastCandle.close >= candles[0].open ? 'BULLISH' : 'BEARISH',
                demoSignal: indicators.rsi14 < 35 ? 'BUY' : indicators.rsi14 > 65 ? 'SELL' : 'WAIT',
                confidence: 68,
                reason: `Simulated market analysis: RSI=${indicators.rsi14}, EMA21=${indicators.ema21}`,
                indicators,
                candles,
                dataSource: 'SIMULATED MARKET DATA',
                status: 'SIMULATED',
                isLive: false,
                timeframe: '5m'
            };
            this.assets.set(def.symbol, asset);
        }
    }
    generateCandles(basePrice, variance, count) {
        const candles = [];
        let lastClose = Number(basePrice);
        const now = Date.now();
        const intervalMs = 300000; // 5m
        for (let i = 0; i < count; i++) {
            const isGreen = (i * 7 + 3) % 10 > 3;
            const change = (isGreen ? 1 : -1) * (variance * 0.4 + (i % 5) * (variance * 0.1));
            const open = Number(lastClose.toFixed(5));
            const close = Number((open + change).toFixed(5));
            const high = Number((Math.max(open, close) + variance * 0.2).toFixed(5));
            const low = Number((Math.min(open, close) - variance * 0.2).toFixed(5));
            const volume = Number((1000 + (i % 10) * 150).toFixed(2));
            candles.push({
                timestamp: now - (count - i) * intervalMs,
                open,
                high,
                low,
                close,
                volume
            });
            lastClose = close;
        }
        return candles;
    }
    supportsAsset(symbol) {
        const clean = symbol.toUpperCase().replace('-', '/');
        return this.defaultDefinitions.some(d => d.symbol === clean);
    }
    async getQuote(symbol, timeframe = '5m') {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by mock provider`);
        }
        return {
            asset: asset.symbol,
            timeframe,
            price: asset.price,
            timestamp: new Date().toISOString(),
            source: 'mock',
            isLive: false,
            status: 'SIMULATED',
            change24h: asset.change24h,
            changePercent: asset.changePercent
        };
    }
    async getCandles(symbol, timeframe = '5m', count = 60) {
        const clean = symbol.toUpperCase().replace('-', '/');
        const asset = this.assets.get(clean);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by mock provider`);
        }
        if (asset.candles.length >= count) {
            return asset.candles.slice(-count);
        }
        const def = this.defaultDefinitions.find(d => d.symbol === clean);
        const basePrice = def ? def.basePrice : asset.price;
        const variance = def ? def.variance : asset.price * 0.001;
        return this.generateCandles(basePrice, variance, Math.max(count, 120));
    }
    async getAllAssets() {
        return Array.from(this.assets.values());
    }
    async getAsset(symbol, timeframe = '5m') {
        const clean = symbol.toUpperCase().replace('-', '/');
        const asset = this.assets.get(clean);
        if (!asset)
            return null;
        return { ...asset, timeframe };
    }
    tick() {
        const updated = [];
        for (const [symbol, asset] of this.assets.entries()) {
            const def = this.defaultDefinitions.find(d => d.symbol === symbol);
            const variance = def ? def.variance : asset.price * 0.001;
            const deltaPct = (Math.random() - 0.5) * 0.0016; // +/- 0.08%
            const newPrice = Number((asset.price * (1 + deltaPct)).toFixed(5));
            const newChange = Number((asset.change24h + (newPrice - asset.price)).toFixed(5));
            const newChangePct = Number(((newChange / newPrice) * 100).toFixed(2));
            const candles = [...asset.candles];
            if (candles.length > 0) {
                const last = { ...candles[candles.length - 1] };
                last.close = newPrice;
                last.high = Math.max(last.high, newPrice);
                last.low = Math.min(last.low, newPrice);
                candles[candles.length - 1] = last;
            }
            const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
            const updatedAsset = {
                ...asset,
                price: newPrice,
                change24h: newChange,
                changePercent: newChangePct,
                trend: newChange >= 0 ? 'BULLISH' : 'BEARISH',
                demoSignal: indicators.rsi14 < 35 ? 'BUY' : indicators.rsi14 > 65 ? 'SELL' : 'WAIT',
                confidence: 70,
                reason: `Simulated tick: RSI=${indicators.rsi14}, EMA21=${indicators.ema21}`,
                indicators,
                candles,
                dataSource: 'SIMULATED MARKET DATA',
                status: 'SIMULATED',
                isLive: false
            };
            this.assets.set(symbol, updatedAsset);
            updated.push(updatedAsset);
        }
        return updated;
    }
}
exports.MockMarketDataProvider = MockMarketDataProvider;
