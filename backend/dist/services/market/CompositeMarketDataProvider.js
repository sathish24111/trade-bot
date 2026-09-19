"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeMarketDataProvider = void 0;
const MockMarketDataProvider_1 = require("./MockMarketDataProvider");
const CryptoMarketDataProvider_1 = require("./CryptoMarketDataProvider");
const ForexMarketDataProvider_1 = require("./ForexMarketDataProvider");
const env_1 = require("../../config/env");
class CompositeMarketDataProvider {
    name = 'composite';
    mockProvider;
    cryptoProvider;
    forexProvider;
    mode;
    constructor(mode = env_1.env.MARKET_DATA_PROVIDER) {
        this.mode = mode;
        this.mockProvider = new MockMarketDataProvider_1.MockMarketDataProvider();
        this.cryptoProvider = new CryptoMarketDataProvider_1.CryptoMarketDataProvider();
        this.forexProvider = new ForexMarketDataProvider_1.ForexMarketDataProvider();
    }
    setMode(mode) {
        this.mode = mode;
    }
    getProviderForAsset(symbol) {
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
    supportsAsset(symbol) {
        return this.getProviderForAsset(symbol) !== null;
    }
    async getQuote(symbol, timeframe = '5m') {
        const provider = this.getProviderForAsset(symbol);
        if (!provider) {
            const activeDesc = this.mode === 'mock' ? 'MockMarketDataProvider' : 'CryptoMarketDataProvider/ForexMarketDataProvider';
            throw new Error(`Asset ${symbol} is not supported by active provider (${activeDesc})`);
        }
        return provider.getQuote(symbol, timeframe);
    }
    async getCandles(symbol, timeframe = '5m', count = 60) {
        const provider = this.getProviderForAsset(symbol);
        if (!provider) {
            const activeDesc = this.mode === 'mock' ? 'MockMarketDataProvider' : 'CryptoMarketDataProvider/ForexMarketDataProvider';
            throw new Error(`Asset ${symbol} is not supported by active provider (${activeDesc})`);
        }
        return provider.getCandles(symbol, timeframe, count);
    }
    async getAllAssets() {
        if (this.mode === 'mock') {
            return this.mockProvider.getAllAssets();
        }
        const [cryptoAssets, forexAssets] = await Promise.all([
            this.cryptoProvider.getAllAssets(),
            this.forexProvider.getAllAssets()
        ]);
        return [...cryptoAssets, ...forexAssets];
    }
    async getAsset(symbol, timeframe = '5m') {
        const provider = this.getProviderForAsset(symbol);
        if (!provider) {
            return null;
        }
        return provider.getAsset(symbol, timeframe);
    }
    tick() {
        return this.mockProvider.tick();
    }
}
exports.CompositeMarketDataProvider = CompositeMarketDataProvider;
