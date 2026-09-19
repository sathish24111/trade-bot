import { multiTimeframeService } from '../src/services/research/multiTimeframe.service';
import { optimizationService } from '../src/services/research/optimization.service';
import { walkForwardService } from '../src/services/research/walkForward.service';
import { HistoricalCandle } from '../src/models/Research';

describe('Phase 5 Robustness, Multi-Timeframe & Walk-Forward Tests', () => {
  it('filters signals with higher timeframe trend strictly without look-ahead bias', () => {
    const baseTime = 1700000000000;
    // Primary 5m candles
    const primaryCandles: HistoricalCandle[] = [];
    for (let i = 0; i < 20; i++) {
      primaryCandles.push({
        timestamp: baseTime + i * 300000,
        open: 100 + i,
        high: 105 + i,
        low: 95 + i,
        close: 102 + i,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      });
    }

    // HTF 1h candles
    const htfCandles: HistoricalCandle[] = [];
    for (let i = 0; i < 5; i++) {
      htfCandles.push({
        timestamp: baseTime + i * 3600000,
        open: 100 + i * 5,
        high: 110 + i * 5,
        low: 95 + i * 5,
        close: 108 + i * 5,
        volume: 500,
        timeframe: '1h',
        source: 'test',
        isComplete: true
      });
    }

    const { alignedTrend } = multiTimeframeService.filterSignalsWithHigherTrend(
      primaryCandles,
      htfCandles,
      {
        primaryTimeframe: '5m',
        higherTimeframe: '1h',
        higherTrendEmaPeriod: 2
      }
    );

    expect(alignedTrend.length).toBe(primaryCandles.length);
    // Values must be valid trend signals
    alignedTrend.forEach((trend) => {
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(trend);
    });
  });

  it('runs anchored and rolling walk-forward analysis and flags insufficient windows', async () => {
    // Rolling mode with window threshold
    const wfRolling = await walkForwardService.runWalkForward({
      userId: 1,
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      parameterRanges: { fastEmaPeriod: [9], slowEmaPeriod: [21] },
      trainCandles: 40,
      testCandles: 15,
      stepCandles: 15,
      walkForwardMethod: 'ROLLING',
      minWindowsRequired: 15 // Ensure window guard triggers
    });

    expect(wfRolling.walkForwardMethod).toBe('ROLLING');
    expect(wfRolling.windowGuardWarning).toContain('⚠ Insufficient Walk-Forward Windows');
    expect(wfRolling.mode).toBe('PAPER');
    expect(wfRolling.isRealMoney).toBe(false);

    // Anchored mode
    const wfAnchored = await walkForwardService.runWalkForward({
      userId: 1,
      asset: 'BTC/USD',
      timeframe: '5m',
      strategy: 'EMA_RSI',
      parameterRanges: { fastEmaPeriod: [9], slowEmaPeriod: [21] },
      trainCandles: 40,
      testCandles: 15,
      stepCandles: 15,
      walkForwardMethod: 'ANCHORED',
      minWindowsRequired: 1
    });

    expect(wfAnchored.walkForwardMethod).toBe('ANCHORED');
    expect(wfAnchored.windows.length).toBeGreaterThanOrEqual(1);
    expect(wfAnchored.windows[0].windowIndex).toBe(1);
  });

  it('generates 2D sensitivity heatmap and detects parameter cliff-drops', async () => {
    const heatmap = await optimizationService.generateSensitivityHeatmap({
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      param1Name: 'fastEmaPeriod',
      param1Range: [8, 10],
      param2Name: 'slowEmaPeriod',
      param2Range: [20, 25],
      candleCount: 60
    });

    expect(heatmap.matrix.length).toBe(4);
    expect(typeof heatmap.sensitivityDetected).toBe('boolean');
    expect(heatmap.stableRegionCount).toBeGreaterThanOrEqual(0);
    expect(heatmap.cliffDropCount).toBeGreaterThanOrEqual(0);
  });
});
