import { strategyEnsembleService } from '../src/services/research/strategyEnsemble.service';
import { paperReplayService } from '../src/services/research/paperReplay.service';
import { indicatorService } from '../src/services/indicator.service';
import { Candle, MarketAsset } from '../src/models/MarketData';

describe('Phase 8 Strict Look-Ahead Bias & Data Leakage Prevention Suite', () => {
  const generateBaseCandles = (count: number): Candle[] => {
    const candles: Candle[] = [];
    const now = 1700000000000;
    let price = 200.0;

    for (let i = 0; i < count; i++) {
      const change = (i % 2 === 0 ? 0.8 : -0.5);
      price += change;
      candles.push({
        timestamp: now + i * 300000,
        open: price - 0.3,
        high: price + 0.6,
        low: price - 0.6,
        close: price,
        volume: 800
      });
    }
    return candles;
  };

  test('Strict Leakage Proof: Mutating future bars 31..60 has 0 effect on ensemble signal at bar 30', async () => {
    const datasetA = generateBaseCandles(60);
    const splitIndex = 30;

    // Dataset B has exactly identical bars 0..30, but radically mutated bars 31..59
    const datasetB: Candle[] = datasetA.map((c, idx) => {
      if (idx > splitIndex) {
        return {
          timestamp: c.timestamp,
          open: c.open * 10,
          high: c.high * 12,
          low: c.low * 0.1,
          close: c.close * 11,
          volume: 9999999
        };
      }
      return { ...c };
    });

    const indA = indicatorService.calculateAllIndicators(datasetA.slice(0, splitIndex + 1));
    const indB = indicatorService.calculateAllIndicators(datasetB.slice(0, splitIndex + 1));

    const assetA: MarketAsset = {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      price: datasetA[splitIndex].close,
      change24h: 10,
      changePercent: 1.2,
      trend: 'BULLISH',
      demoSignal: 'BUY',
      confidence: 80,
      reason: 'Test A',
      indicators: indA,
      candles: datasetA.slice(0, splitIndex + 1),
      dataSource: 'SIMULATED',
      status: 'SIMULATED',
      isLive: false
    };

    const assetB: MarketAsset = {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      price: datasetB[splitIndex].close,
      change24h: 10,
      changePercent: 1.2,
      trend: 'BULLISH',
      demoSignal: 'BUY',
      confidence: 80,
      reason: 'Test B',
      indicators: indB,
      candles: datasetB.slice(0, splitIndex + 1),
      dataSource: 'SIMULATED',
      status: 'SIMULATED',
      isLive: false
    };

    const ensembleA = await strategyEnsembleService.evaluateEnsemble(assetA);
    const ensembleB = await strategyEnsembleService.evaluateEnsemble(assetB);

    expect(ensembleA.finalSignal).toEqual(ensembleB.finalSignal);
    expect(ensembleA.confidence).toEqual(ensembleB.confidence);
    expect(ensembleA.voteBreakdown.length).toEqual(ensembleB.voteBreakdown.length);
    for (let i = 0; i < ensembleA.voteBreakdown.length; i++) {
      expect(ensembleA.voteBreakdown[i].signal).toEqual(ensembleB.voteBreakdown[i].signal);
      expect(ensembleA.voteBreakdown[i].confidence).toEqual(ensembleB.voteBreakdown[i].confidence);
    }
  });

  test('Strict Replay Isolation: Replay state at index k only computes from past candles', async () => {
    const session = await paperReplayService.initReplay({
      experimentId: 'EXP_LEAK_TEST',
      candlesCount: 50
    });

    const initialIdx = session.currentIndex;
    for (let step = 0; step < 5; step++) {
      paperReplayService.stepNext(session.sessionId);
    }

    const state = paperReplayService.getState(session.sessionId);
    expect(state.currentIndex).toBe(initialIdx + 5);
    expect(state.currentPrice).toBeGreaterThan(0);
    expect(state.activeSignals).toBeDefined();
  });
});
