"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForexMarketDataProvider = void 0;
const indicator_service_1 = require("../indicator.service");
class ForexMarketDataProvider {
    name = 'forex-open';
    supported = [
        { symbol: 'EUR/USD', name: 'Euro / US Dollar', baseCurrency: 'EUR', quoteCurrency: 'USD', defaultRate: 1.08245 },
        { symbol: 'GBP/USD', name: 'British Pound / US Dollar', baseCurrency: 'GBP', quoteCurrency: 'USD', defaultRate: 1.26420 },
        { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', baseCurrency: 'USD', quoteCurrency: 'JPY', defaultRate: 154.350 }
    ];
    cache = new Map();
    supportsAsset(symbol) {
        const clean = symbol.toUpperCase().replace('-', '/');
        return this.supported.some(s => s.symbol === clean);
    }
    async getQuote(symbol, timeframe = '5m') {
        const asset = await this.getAsset(symbol, timeframe);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by ForexMarketDataProvider`);
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
            throw new Error(`Asset ${symbol} is not supported by ForexMarketDataProvider`);
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
        const def = this.supported.find(s => s.symbol === clean);
        if (!def) {
            return null;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://api.frankfurter.app/latest?from=${def.baseCurrency}&to=${def.quoteCurrency}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                const currentRate = data.rates[def.quoteCurrency];
                if (currentRate && typeof currentRate === 'number') {
                    const candles = this.generateHistoricalCandles(currentRate, 60);
                    const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
                    const asset = {
                        symbol: def.symbol,
                        name: def.name,
                        price: currentRate,
                        change24h: Number((currentRate - candles[0].open).toFixed(5)),
                        changePercent: Number((((currentRate - candles[0].open) / candles[0].open) * 100).toFixed(2)),
                        trend: currentRate >= candles[0].open ? 'BULLISH' : 'BEARISH',
                        demoSignal: indicators.rsi14 < 35 ? 'BUY' : indicators.rsi14 > 65 ? 'SELL' : 'WAIT',
                        confidence: 65,
                        reason: `Forex live rate: RSI=${indicators.rsi14}, EMA21=${indicators.ema21}`,
                        indicators,
                        candles,
                        dataSource: 'frankfurter-forex',
                        status: 'LIVE',
                        isLive: true,
                        timeframe
                    };
                    this.cache.set(def.symbol, asset);
                    return asset;
                }
            }
        }
        catch {
            // Offline or request timed out
        }
        const cached = this.cache.get(def.symbol);
        if (cached) {
            return {
                ...cached,
                status: 'CACHED',
                isLive: false,
                dataSource: 'frankfurter-forex (cached)',
                timeframe
            };
        }
        return this.createSimulatedFallback(def, timeframe);
    }
    generateHistoricalCandles(basePrice, count) {
        const candles = [];
        let price = basePrice;
        const now = Date.now();
        const intervalMs = 300000;
        const variance = basePrice * 0.0005;
        for (let i = 0; i < count; i++) {
            const open = price;
            const change = (Math.random() - 0.49) * variance;
            const close = Number((open + change).toFixed(5));
            const high = Number((Math.max(open, close) + Math.random() * variance * 0.5).toFixed(5));
            const low = Number((Math.min(open, close) - Math.random() * variance * 0.5).toFixed(5));
            candles.push({ timestamp: now - (count - i) * intervalMs, open, high, low, close, volume: 50 });
            price = close;
        }
        return candles;
    }
    createSimulatedFallback(def, timeframe) {
        const candles = this.generateHistoricalCandles(def.defaultRate, 60);
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(candles);
        const last = candles[candles.length - 1];
        return {
            symbol: def.symbol,
            name: def.name,
            price: last.close,
            change24h: 0,
            changePercent: 0,
            trend: 'NEUTRAL',
            demoSignal: 'WAIT',
            confidence: 50,
            reason: 'Network unreachable: simulated fallback data',
            indicators,
            candles,
            dataSource: 'forex-offline-fallback',
            status: 'SIMULATED',
            isLive: false,
            timeframe
        };
    }
}
exports.ForexMarketDataProvider = ForexMarketDataProvider;
