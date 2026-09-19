import { randomUUID } from 'crypto';
import { pool } from '../../config/database';
import { AnomalyType, MarketAnomaly } from '../../models/Monitoring';

export class AnomalyDetectionService {
  private inMemoryAnomalies: Map<string, MarketAnomaly> = new Map();

  /**
   * Evaluates market price, spread, and candle integrity for anomalies.
   */
  async checkCandleAnomaly(asset: string, candle: { open: number; high: number; low: number; close: number; timestamp: string }): Promise<MarketAnomaly | null> {
    // 1. Check for impossible price or negative values
    if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
      return this.recordAnomaly({
        type: 'INVALID_VALUES',
        asset,
        severity: 'CRITICAL',
        observedValue: `O:${candle.open}, C:${candle.close}`,
        expectedRange: '> 0',
        explanation: 'Negative or zero price values detected in candle bar.'
      });
    }

    if (candle.high < candle.low || candle.high < candle.close || candle.low > candle.close) {
      return this.recordAnomaly({
        type: 'IMPOSSIBLE_PRICE',
        asset,
        severity: 'HIGH',
        observedValue: `H:${candle.high}, L:${candle.low}, C:${candle.close}`,
        expectedRange: 'Low <= Close <= High',
        explanation: 'OHLC consistency violation: High is less than Low or Close is outside bounds.'
      });
    }

    // 2. Check for extreme price spike (> 10% move in single bar)
    const priceChangePct = Math.abs((candle.close - candle.open) / candle.open) * 100;
    if (priceChangePct > 10.0) {
      return this.recordAnomaly({
        type: 'PRICE_SPIKE',
        asset,
        severity: 'WARNING',
        observedValue: `${priceChangePct.toFixed(2)}%`,
        expectedRange: '< 10.0%',
        explanation: `Extreme single-bar price jump of ${priceChangePct.toFixed(2)}% observed.`
      });
    }

    return null;
  }

  /**
   * Checks execution slippage and spread anomalies.
   */
  async checkExecutionAnomaly(params: {
    asset: string;
    expectedPrice: number;
    actualPrice: number;
    slippage: number;
  }): Promise<MarketAnomaly | null> {
    if (params.slippage > 0.02) { // > 2% slippage in paper execution is anomalous
      return this.recordAnomaly({
        type: 'ABNORMAL_SLIPPAGE',
        asset: params.asset,
        severity: 'HIGH',
        observedValue: `${(params.slippage * 100).toFixed(2)}%`,
        expectedRange: '< 2.0%',
        explanation: `Abnormal execution slippage of ${(params.slippage * 100).toFixed(2)}% detected in simulation.`
      });
    }
    return null;
  }

  /**
   * Checks for unexpected P&L jumps or negative balances.
   */
  async checkBalanceAnomaly(asset: string, balance: number, tradePnl: number): Promise<MarketAnomaly | null> {
    if (balance < 0) {
      return this.recordAnomaly({
        type: 'INVALID_VALUES',
        asset,
        severity: 'CRITICAL',
        observedValue: `₹${balance.toFixed(2)}`,
        expectedRange: '>= ₹0.00',
        explanation: 'Simulated paper balance dropped below zero.'
      });
    }

    if (Math.abs(tradePnl) > 5000) {
      return this.recordAnomaly({
        type: 'UNEXPECTED_PNL_JUMP',
        asset,
        severity: 'WARNING',
        observedValue: `₹${tradePnl.toFixed(2)}`,
        expectedRange: '[-₹5000, ₹5000]',
        explanation: 'Disproportionately large single paper trade P&L jump detected.'
      });
    }

    return null;
  }

  /**
   * Records and persists a detected anomaly.
   */
  async recordAnomaly(params: {
    type: AnomalyType;
    asset: string;
    severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
    observedValue: string | number;
    expectedRange: string;
    explanation: string;
  }): Promise<MarketAnomaly> {
    const id = `anom_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 6)}`;
    const anomaly: MarketAnomaly = {
      id,
      type: params.type,
      timestamp: new Date().toISOString(),
      asset: params.asset,
      severity: params.severity,
      observedValue: params.observedValue,
      expectedRange: params.expectedRange,
      explanation: params.explanation,
      resolved: false
    };

    this.inMemoryAnomalies.set(id, anomaly);

    try {
      await pool.query(
        `INSERT INTO anomalies (id, type, asset, severity, observed_value, expected_range, explanation, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [
          anomaly.id,
          anomaly.type,
          anomaly.asset,
          anomaly.severity,
          String(anomaly.observedValue),
          anomaly.expectedRange,
          anomaly.explanation
        ]
      );
    } catch {
      // In-memory fallback
    }

    return anomaly;
  }

  /**
   * Retrieves detected anomalies list.
   */
  async getAnomalies(limit = 50): Promise<MarketAnomaly[]> {
    return Array.from(this.inMemoryAnomalies.values()).slice(-limit).reverse();
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
