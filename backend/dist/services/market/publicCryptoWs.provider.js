"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicCryptoWsProvider = exports.PublicCryptoWsProvider = void 0;
const ws_1 = __importDefault(require("ws"));
const dataQualityGate_service_1 = require("./dataQualityGate.service");
const indicator_service_1 = require("../indicator.service");
class PublicCryptoWsProvider {
    name = 'crypto-ws-public';
    ws = null;
    state = 'HEALTHY';
    assets = new Map();
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    reconnectTimer = null;
    heartbeatTimer = null;
    isConnecting = false;
    listeners = [];
    // Metrics
    reconnectCount = 0;
    errorCount = 0;
    messageCount = 0;
    lastMessageTime = 0;
    latencyMs = 0;
    startTime = Date.now();
    backoffDelays = [1000, 2000, 4000, 8000, 16000, 30000];
    constructor() {
        this.initDefaultAssets();
    }
    initDefaultAssets() {
        const defaults = [
            { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', pair: 'btcusdt', price: 64850.0 },
            { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', pair: 'ethusdt', price: 3480.0 }
        ];
        for (const d of defaults) {
            const now = Date.now();
            const candles = [];
            for (let i = 59; i >= 0; i--) {
                const time = now - i * 300000;
                const p = d.price * (1 + (Math.random() - 0.5) * 0.01);
                candles.push({
                    timestamp: time,
                    open: p * 0.999,
                    high: p * 1.002,
                    low: p * 0.998,
                    close: p,
                    volume: 10 + Math.random() * 50
                });
            }
            this.assets.set(d.symbol, {
                symbol: d.symbol,
                name: d.name,
                pair: d.pair,
                price: d.price,
                change24h: 120.5,
                changePercent: 1.85,
                lastUpdated: now,
                candles
            });
        }
    }
    getState() {
        return this.state;
    }
    setState(newState) {
        this.state = newState;
    }
    supportsAsset(symbol) {
        const clean = symbol.toUpperCase().replace('-', '/');
        return this.assets.has(clean);
    }
    onTick(listener) {
        this.listeners.push(listener);
    }
    async connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === ws_1.default.OPEN)) {
            return;
        }
        this.isConnecting = true;
        this.state = this.reconnectAttempts > 0 ? 'RECOVERING' : 'HEALTHY';
        const streams = 'btcusdt@ticker/ethusdt@ticker';
        const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        try {
            this.ws = new ws_1.default(url, {
                handshakeTimeout: 5000
            });
            this.ws.on('open', () => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.state = 'HEALTHY';
                this.startHeartbeat();
            });
            this.ws.on('message', (raw) => {
                try {
                    const t0 = Date.now();
                    const parsed = JSON.parse(raw.toString());
                    this.handleIncomingMessage(parsed);
                    this.latencyMs = Math.max(1, Date.now() - t0);
                    this.lastMessageTime = Date.now();
                    this.messageCount++;
                }
                catch {
                    this.errorCount++;
                }
            });
            this.ws.on('error', () => {
                this.errorCount++;
                this.state = 'DEGRADED';
            });
            this.ws.on('close', () => {
                this.isConnecting = false;
                this.stopHeartbeat();
                if (this.state !== 'DISABLED') {
                    this.state = 'FAILED';
                    this.scheduleReconnect();
                }
            });
        }
        catch {
            this.isConnecting = false;
            this.state = 'FAILED';
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.state = 'FAILED';
            return;
        }
        const delay = this.backoffDelays[Math.min(this.reconnectAttempts, this.backoffDelays.length - 1)];
        this.reconnectAttempts++;
        this.reconnectCount++;
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => { });
        }, delay);
    }
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
                this.ws.ping();
            }
        }, 15000);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    disconnect() {
        this.state = 'DISABLED';
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopHeartbeat();
        if (this.ws) {
            try {
                this.ws.close();
            }
            catch { }
            this.ws = null;
        }
    }
    /**
     * Parses & normalizes incoming ticker message
     */
    handleIncomingMessage(msg) {
        const data = msg.data || msg;
        if (!data || !data.s)
            return;
        const streamSymbol = data.s.toUpperCase();
        let symbol = 'BTC/USD';
        if (streamSymbol.includes('ETH')) {
            symbol = 'ETH/USD';
        }
        const asset = this.assets.get(symbol);
        if (!asset)
            return;
        const price = parseFloat(data.c || data.lastPrice || asset.price);
        const bid = parseFloat(data.b || price * 0.9999);
        const ask = parseFloat(data.a || price * 1.0001);
        const volume = parseFloat(data.v || 0);
        const change24h = parseFloat(data.p || 0);
        const changePercent = parseFloat(data.P || 0);
        const timestamp = data.E ? Number(data.E) : Date.now();
        const normalizedTick = {
            asset: symbol,
            timestamp,
            price,
            bid,
            ask,
            volume,
            provider: this.name,
            status: 'LIVE_READ_ONLY',
            isLive: true
        };
        // Quality gate validation
        const validation = dataQualityGate_service_1.dataQualityGate.validateTick(normalizedTick);
        if (!validation.isValid) {
            this.errorCount++;
            return;
        }
        // Update internal state
        asset.price = price;
        asset.change24h = change24h;
        asset.changePercent = changePercent;
        asset.lastUpdated = timestamp;
        // Append / update last candle
        if (asset.candles.length > 0) {
            const lastCandle = asset.candles[asset.candles.length - 1];
            if (timestamp - lastCandle.timestamp < 300000) {
                lastCandle.close = price;
                lastCandle.high = Math.max(lastCandle.high, price);
                lastCandle.low = Math.min(lastCandle.low, price);
                lastCandle.volume = (lastCandle.volume || 0) + (volume > 0 ? volume * 0.01 : 0.05);
            }
            else {
                asset.candles.push({
                    timestamp,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: 1.0
                });
                if (asset.candles.length > 100)
                    asset.candles.shift();
            }
        }
        for (const listener of this.listeners) {
            try {
                listener(normalizedTick);
            }
            catch { }
        }
    }
    async getQuote(symbol, timeframe = '5m') {
        const clean = symbol.toUpperCase().replace('-', '/');
        const asset = this.assets.get(clean);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by PublicCryptoWsProvider`);
        }
        const isLive = this.state === 'HEALTHY' || (this.state !== 'FAILED' && Date.now() - asset.lastUpdated < 300000);
        return {
            asset: clean,
            timeframe,
            price: asset.price,
            timestamp: new Date(asset.lastUpdated).toISOString(),
            source: 'LIVE READ-ONLY DATA (Crypto WS)',
            isLive,
            status: isLive ? 'LIVE_READ_ONLY' : 'DEGRADED',
            change24h: asset.change24h,
            changePercent: asset.changePercent
        };
    }
    async getCandles(symbol, timeframe = '5m', count = 60) {
        const clean = symbol.toUpperCase().replace('-', '/');
        const asset = this.assets.get(clean);
        if (!asset) {
            throw new Error(`Asset ${symbol} is not supported by PublicCryptoWsProvider`);
        }
        return asset.candles.slice(-count);
    }
    async getAllAssets() {
        const results = [];
        for (const [_, asset] of this.assets.entries()) {
            const indicators = indicator_service_1.indicatorService.calculateAllIndicators(asset.candles);
            results.push({
                symbol: asset.symbol,
                name: asset.name,
                price: asset.price,
                change24h: asset.change24h,
                changePercent: asset.changePercent,
                trend: indicators.ema21 > indicators.sma50 ? 'BULLISH' : 'BEARISH',
                demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
                confidence: 85,
                reason: 'Public Crypto WS Feed',
                indicators,
                candles: asset.candles,
                dataSource: 'LIVE READ-ONLY DATA (Crypto WS)',
                status: this.state === 'HEALTHY' ? 'LIVE_READ_ONLY' : 'DEGRADED',
                isLive: this.state === 'HEALTHY'
            });
        }
        return results;
    }
    async getAsset(symbol, timeframe = '5m') {
        const clean = symbol.toUpperCase().replace('-', '/');
        const asset = this.assets.get(clean);
        if (!asset)
            return null;
        const indicators = indicator_service_1.indicatorService.calculateAllIndicators(asset.candles);
        return {
            symbol: asset.symbol,
            name: asset.name,
            price: asset.price,
            change24h: asset.change24h,
            changePercent: asset.changePercent,
            trend: indicators.ema21 > indicators.sma50 ? 'BULLISH' : 'BEARISH',
            demoSignal: indicators.rsi14 < 30 ? 'BUY' : indicators.rsi14 > 70 ? 'SELL' : 'WAIT',
            confidence: 85,
            reason: 'Public Crypto WS Feed',
            indicators,
            candles: asset.candles,
            dataSource: 'LIVE READ-ONLY DATA (Crypto WS)',
            status: this.state === 'HEALTHY' ? 'LIVE_READ_ONLY' : 'DEGRADED',
            isLive: this.state === 'HEALTHY',
            timeframe
        };
    }
}
exports.PublicCryptoWsProvider = PublicCryptoWsProvider;
exports.publicCryptoWsProvider = new PublicCryptoWsProvider();
