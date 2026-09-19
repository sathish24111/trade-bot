"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketService = void 0;
__exportStar(require("./market/MarketDataProvider.interface"), exports);
__exportStar(require("./market/MockMarketDataProvider"), exports);
__exportStar(require("./market/CryptoMarketDataProvider"), exports);
__exportStar(require("./market/ForexMarketDataProvider"), exports);
__exportStar(require("./market/CompositeMarketDataProvider"), exports);
const CompositeMarketDataProvider_1 = require("./market/CompositeMarketDataProvider");
const env_1 = require("../config/env");
exports.marketService = new CompositeMarketDataProvider_1.CompositeMarketDataProvider(env_1.env.MARKET_DATA_PROVIDER);
