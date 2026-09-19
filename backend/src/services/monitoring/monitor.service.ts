import { marketService } from '../market.service';
import { strategyEngine } from '../strategy.service';
import { marketHealthService } from './marketHealth.service';
import { signalQualityService } from './signalQuality.service';
import { riskMonitorService } from './riskMonitor.service';
import { portfolioExposureService } from './portfolioExposure.service';
import { strategyControlService } from './strategyControl.service';
import { Candle } from '../../models/MarketData';

export interface MonitorOverviewState {
  asset: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  changePercent: number;
  currentCandle: Candle | null;
  completedCandle: Candle | null;
  activeSignal: 'BUY' | 'SELL' | 'WAIT';
  signalConfidence: number;
  strategy: string;
  currentPosition: {
    direction: 'BUY' | 'SELL';
    amount: number;
    entryPrice: number;
    unrealizedPnl: number;
  } | null;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyPnl: number;
  drawdown: number;
  exposure: number;
  riskUtilization: number;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
  currentRegime: string;
  dataFreshness: string;
  mode: 'PAPER';
  isRealMoney: false;
  brokerConnected: false;
}

export class MonitorService {
  /**
   * Evaluates the real-time paper trading monitoring state for a given asset and strategy.
   * Strictly uses closed (completed) candles for strategy signals (zero look-ahead).
   */
  async getMonitorOverview(asset = 'BTC/USD', strategy = 'EMA_RSI'): Promise<MonitorOverviewState> {
    const candles = await marketService.getCandles(asset, '5m', 50);
    const health = await marketHealthService.evaluateAssetHealth(asset, '5m');

    let currentCandle: Candle | null = null;
    let completedCandle: Candle | null = null;
    let currentPrice = 50000.0;
    let previousPrice = 50000.0;

    if (candles.length > 0) {
      currentCandle = candles[candles.length - 1];
      currentPrice = currentCandle.close;
      if (candles.length > 1) {
        completedCandle = candles[candles.length - 2];
        previousPrice = completedCandle.close;
      } else {
        previousPrice = currentCandle.open;
      }
    }

    const priceChange = Math.round((currentPrice - previousPrice) * 100) / 100;
    const changePercent = previousPrice > 0 ? Math.round(((currentPrice - previousPrice) / previousPrice) * 100 * 100) / 100 : 0.0;

    // Evaluate strategy signal strictly using completed candle history
    let activeSignal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let signalConfidence = 50;

    const isAllowed = strategyControlService.isSignalGenerationAllowed(strategy);
    if (isAllowed && candles.length >= 2) {
      // Pass candles up to completed candle (index 0 to length - 2) to eliminate intra-bar repainting
      const closedHistory = candles.slice(0, candles.length - 1);
      const evalResult = strategyEngine.evaluateFromCandles(strategy, closedHistory);
      activeSignal = evalResult.signal;
      signalConfidence = evalResult.confidence;
    }

    // Fetch live risk snapshot
    const riskState = riskMonitorService.getLatestState();

    return {
      asset,
      currentPrice,
      previousPrice,
      priceChange,
      changePercent,
      currentCandle,
      completedCandle,
      activeSignal,
      signalConfidence,
      strategy,
      currentPosition: null, // Simulated idle position
      unrealizedPnl: 0.0,
      realizedPnl: riskState.dailyPnL,
      dailyPnl: riskState.dailyPnL,
      drawdown: riskState.currentDrawdown,
      exposure: riskState.portfolioExposure,
      riskUtilization: riskState.riskUtilization,
      tradeCount: riskState.positionCount,
      winningTrades: 0,
      losingTrades: riskState.consecutiveLosses,
      currentRegime: riskState.marketRegime,
      dataFreshness: health.status,
      mode: 'PAPER',
      isRealMoney: false,
      brokerConnected: false
    };
  }
}

export const monitorService = new MonitorService();
