"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataQualityGate = exports.DataQualityGateService = void 0;
class DataQualityGateService {
    lastTicksByAsset = new Map();
    lastCandlesByAsset = new Map();
    /**
     * Validates a single incoming market tick
     */
    validateTick(tick) {
        const now = Date.now();
        const result = {
            isValid: true,
            timestampOk: true,
            priceOk: true,
            ohlcOk: true,
            volumeOk: true,
            sequenceOk: true,
            duplicate: false,
            gapDetected: false,
            abnormalJump: false,
            stale: false
        };
        // 1. Timestamp validation
        if (!tick.timestamp || isNaN(tick.timestamp) || tick.timestamp > now + 30000) {
            result.timestampOk = false;
            result.isValid = false;
            result.reason = 'Invalid or future timestamp beyond tolerance';
            return result;
        }
        // Stale check (older than 3 minutes)
        if (now - tick.timestamp > 180000) {
            result.stale = true;
            // Stale data is flagged, still valid if backfilling, but marks alert
        }
        // 2. Price validation
        if (typeof tick.price !== 'number' || isNaN(tick.price) || tick.price <= 0) {
            result.priceOk = false;
            result.isValid = false;
            result.reason = 'Price must be positive non-zero number';
            return result;
        }
        // 3. Volume validation
        if (tick.volume !== undefined && (typeof tick.volume !== 'number' || isNaN(tick.volume) || tick.volume < 0)) {
            result.volumeOk = false;
            result.isValid = false;
            result.reason = 'Volume must be non-negative';
            return result;
        }
        // 4. Comparison with previous tick
        const prev = this.lastTicksByAsset.get(tick.asset);
        if (prev) {
            // Sequence check
            if (tick.timestamp < prev.timestamp) {
                result.sequenceOk = false;
                result.isValid = false;
                result.reason = 'Out-of-order timestamp sequence';
                return result;
            }
            // Duplicate check
            if (tick.timestamp === prev.timestamp && tick.price === prev.price) {
                result.duplicate = true;
                result.isValid = false;
                result.reason = 'Duplicate tick rejected';
                return result;
            }
            // Excessive gap check (> 5 minutes gap)
            if (tick.timestamp - prev.timestamp > 300000) {
                result.gapDetected = true;
            }
            // Abnormal jump check (> 20% instantaneous price move)
            const pctChange = Math.abs(tick.price - prev.price) / prev.price;
            if (pctChange > 0.20) {
                result.abnormalJump = true;
                result.isValid = false;
                result.reason = `Abnormal price jump detected: ${(pctChange * 100).toFixed(2)}%`;
                return result;
            }
        }
        // Update last known tick on valid
        this.lastTicksByAsset.set(tick.asset, tick);
        return result;
    }
    /**
     * Validates an incoming OHLC Candle
     */
    validateCandle(asset, candle) {
        const now = Date.now();
        const result = {
            isValid: true,
            timestampOk: true,
            priceOk: true,
            ohlcOk: true,
            volumeOk: true,
            sequenceOk: true,
            duplicate: false,
            gapDetected: false,
            abnormalJump: false,
            stale: false
        };
        // 1. Timestamp validation
        if (!candle.timestamp || isNaN(candle.timestamp) || candle.timestamp > now + 60000) {
            result.timestampOk = false;
            result.isValid = false;
            result.reason = result.reason || 'Invalid or future candle timestamp';
        }
        // 2. Price > 0
        if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0 ||
            isNaN(candle.open) || isNaN(candle.high) || isNaN(candle.low) || isNaN(candle.close)) {
            result.priceOk = false;
            result.isValid = false;
            result.reason = result.reason || 'All OHLC prices must be positive numbers';
        }
        // 3. OHLC relationships:
        // High must be >= Open, High >= Close, High >= Low
        // Low must be <= Open, Low <= Close
        if (candle.high < candle.low ||
            candle.high < candle.open ||
            candle.high < candle.close ||
            candle.low > candle.open ||
            candle.low > candle.close) {
            result.ohlcOk = false;
            result.isValid = false;
            result.reason = result.reason || 'Invalid OHLC relationship: High must be maximum, Low must be minimum';
        }
        // 4. Volume
        if (candle.volume !== undefined && (candle.volume < 0 || isNaN(candle.volume))) {
            result.volumeOk = false;
            result.isValid = false;
            result.reason = result.reason || 'Candle volume cannot be negative';
        }
        if (!result.isValid) {
            return result;
        }
        // 5. Sequence and duplicate checks against previous candle
        const prevCandle = this.lastCandlesByAsset.get(asset);
        if (prevCandle) {
            if (candle.timestamp < prevCandle.timestamp) {
                result.sequenceOk = false;
                result.isValid = false;
                result.reason = 'Out-of-order candle timestamp';
                return result;
            }
            if (candle.timestamp === prevCandle.timestamp && candle.close === prevCandle.close) {
                result.duplicate = true;
                result.isValid = false;
                result.reason = 'Duplicate candle rejected';
                return result;
            }
            // Check abnormal jump between previous close and current open (> 20%)
            const jump = Math.abs(candle.open - prevCandle.close) / prevCandle.close;
            if (jump > 0.20) {
                result.abnormalJump = true;
                result.isValid = false;
                result.reason = `Abnormal candle gap jump: ${(jump * 100).toFixed(2)}%`;
                return result;
            }
        }
        this.lastCandlesByAsset.set(asset, candle);
        return result;
    }
    reset() {
        this.lastTicksByAsset.clear();
        this.lastCandlesByAsset.clear();
    }
}
exports.DataQualityGateService = DataQualityGateService;
exports.dataQualityGate = new DataQualityGateService();
