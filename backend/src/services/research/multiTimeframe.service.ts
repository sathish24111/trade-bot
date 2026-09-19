import { Candle } from '../../models/MarketData';
import {
  CrossAssetMatrixResult,
  CrossTimeframeMatrixResult,
  HistoricalCandle,
  MultiAssetResult,
  MultiTimeframeConfig
} from '../../models/Research';
import { backtestingService } from '../backtesting.service';
import { indicatorService } from '../indicator.service';
import { marketService } from '../market.service';
import { StrategyParameters } from '../strategy.service';

export class MultiTimeframeService {
  /**
   * Resamples or aligns higher timeframe candles with primary timeframe candles,
   * guaranteeing zero look-ahead bias by strictly considering only closed higher timeframe bars.
   */
  filterSignalsWithHigherTrend(
    primaryCandles: HistoricalCandle[],
    htfCandles: HistoricalCandle[],
    config: MultiTimeframeConfig
  ): {
    alignedTrend: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[];
  } {
    const period = config.higherTrendEmaPeriod || 50;

    // Calculate EMA on the higher timeframe closed candles
    const htfCloses = htfCandles.map((c) => c.close);
    const htfEma = indicatorService.calculateEMA(htfCloses, period);

    const alignedTrend: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = [];

    // For each primary candle, find the latest HTF candle that closed strictly at or before primary candle timestamp
    let htfIdx = 0;
    for (let i = 0; i < primaryCandles.length; i++) {
      const pTime = primaryCandles[i].timestamp;

      // Advance htfIdx as long as next HTF candle closed <= pTime
      while (
        htfIdx + 1 < htfCandles.length &&
        htfCandles[htfIdx + 1].timestamp <= pTime
      ) {
        htfIdx++;
      }

      if (htfIdx < htfCandles.length && htfCandles[htfIdx].timestamp <= pTime) {
        const emaVal = htfEma[htfIdx];
        const htfClose = htfCandles[htfIdx].close;

        if (emaVal !== null) {
          if (htfClose > emaVal) {
            alignedTrend.push('BULLISH');
          } else if (htfClose < emaVal) {
            alignedTrend.push('BEARISH');
          } else {
            alignedTrend.push('NEUTRAL');
          }
        } else {
          alignedTrend.push('NEUTRAL');
        }
      } else {
        alignedTrend.push('NEUTRAL');
      }
    }

    return { alignedTrend };
  }

  /**
   * Validates a strategy across multiple assets (Multi-Asset Robustness Matrix).
   */
  async runCrossAssetValidation(
    strategy: string,
    assets: string[],
    timeframe = '5m',
    parameters?: StrategyParameters,
    candleCount = 100
  ): Promise<CrossAssetMatrixResult> {
    const results: MultiAssetResult[] = [];

    for (const asset of assets) {
      try {
        const backtest = await backtestingService.runBacktest({
          asset,
          timeframe,
          strategy,
          initialBalance: 10000,
          tradeAmount: 100,
          riskPercent: 1.0,
          parameters,
          candleCount
        });

        results.push({
          asset,
          tradesCount: backtest.totalTrades,
          winRate: backtest.winRate,
          netPnl: backtest.netPnl,
          profitFactor: backtest.profitFactor,
          sharpeRatio: backtest.advancedMetrics ? backtest.advancedMetrics.sharpeRatio : null,
          maxDrawdownPercent: backtest.maxDrawdown
        });
      } catch {
        results.push({
          asset,
          tradesCount: 0,
          winRate: 0,
          netPnl: 0,
          profitFactor: 0,
          sharpeRatio: null,
          maxDrawdownPercent: 0
        });
      }
    }

    const validWinRates = results.filter((r) => r.tradesCount > 0).map((r) => r.winRate);
    const avgWinRate = validWinRates.length > 0
      ? validWinRates.reduce((a, b) => a + b, 0) / validWinRates.length
      : 0;

    const validSharpes = results
      .filter((r) => r.sharpeRatio !== null)
      .map((r) => r.sharpeRatio as number);
    const avgSharpe = validSharpes.length > 0
      ? validSharpes.reduce((a, b) => a + b, 0) / validSharpes.length
      : null;

    const robustAssetsCount = results.filter((r) => r.winRate >= 50 && r.netPnl >= 0).length;
    const fragileAssetsCount = results.length - robustAssetsCount;

    return {
      strategy,
      assets: results,
      averageWinRate: Math.round(avgWinRate * 100) / 100,
      averageSharpe: avgSharpe !== null ? Math.round(avgSharpe * 100) / 100 : null,
      robustAssetsCount,
      fragileAssetsCount,
      mode: 'PAPER',
      isRealMoney: false
    };
  }

  /**
   * Validates a strategy across multiple timeframes for a single asset.
   */
  async runCrossTimeframeValidation(
    strategy: string,
    asset: string,
    timeframes: string[] = ['1m', '5m', '15m', '1h'],
    parameters?: StrategyParameters,
    candleCount = 100
  ): Promise<CrossTimeframeMatrixResult> {
    const list = [];

    for (const tf of timeframes) {
      try {
        const backtest = await backtestingService.runBacktest({
          asset,
          timeframe: tf,
          strategy,
          initialBalance: 10000,
          tradeAmount: 100,
          riskPercent: 1.0,
          parameters,
          candleCount
        });

        list.push({
          timeframe: tf,
          tradesCount: backtest.totalTrades,
          winRate: backtest.winRate,
          netPnl: backtest.netPnl,
          profitFactor: backtest.profitFactor,
          sharpeRatio: backtest.advancedMetrics ? backtest.advancedMetrics.sharpeRatio : null,
          maxDrawdownPercent: backtest.maxDrawdown
        });
      } catch {
        list.push({
          timeframe: tf,
          tradesCount: 0,
          winRate: 0,
          netPnl: 0,
          profitFactor: 0,
          sharpeRatio: null,
          maxDrawdownPercent: 0
        });
      }
    }

    return {
      strategy,
      asset,
      timeframes: list,
      mode: 'PAPER',
      isRealMoney: false
    };
  }
}

export const multiTimeframeService = new MultiTimeframeService();
