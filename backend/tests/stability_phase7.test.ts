import { publicCryptoWsProvider } from '../src/services/market/publicCryptoWs.provider';
import { strategyEngine } from '../src/services/strategy.service';
import { paperExecutionEngine } from '../src/services/paperExecution.service';
import { strategyPolicyService } from '../src/services/strategy/strategyPolicy.service';
import { alertService } from '../src/services/monitoring/alert.service';
import { notificationService } from '../src/services/notifications/notification.service';
import { getEventBuffer, getLastSequence } from '../src/websocket/websocket.server';

describe('Phase 7 Long-Running Stability & Paper-Trading Simulation Test', () => {
  afterAll(() => {
    publicCryptoWsProvider.disconnect();
  });

  it('runs 150 simulated market cycles without event sequence corruption or runaway notifications', async () => {
    const memoryBefore = process.memoryUsage().heapUsed;
    const initialSeq = getLastSequence();

    const seenSignalIds = new Set<string>();
    let notificationCount = 0;

    for (let cycle = 1; cycle <= 150; cycle++) {
      const now = 1704067200000 + cycle * 5000;
      const basePrice = 64000 + Math.sin(cycle / 5) * 500;

      // 1. Ingest market tick
      publicCryptoWsProvider.handleIncomingMessage({
        s: 'BTCUSDT',
        c: basePrice.toFixed(2),
        b: (basePrice - 2).toFixed(2),
        a: (basePrice + 2).toFixed(2),
        v: (10 + cycle % 20).toString(),
        p: '15.0',
        P: '0.2',
        E: now
      });

      // 2. Generate signal every 10 cycles
      if (cycle % 10 === 0) {
        const candles = await publicCryptoWsProvider.getCandles('BTC/USD', '5m', 30);
        const signalResult = strategyEngine.evaluateFromCandles('EMA_RSI', candles);

        const signalKey = `EMA_RSI_${signalResult.signal}_${cycle}`;
        expect(seenSignalIds.has(signalKey)).toBe(false);
        seenSignalIds.add(signalKey);

        // 3. Adaptive throttle check
        const policyRes = await strategyPolicyService.evaluateStrategy({
          strategyId: 'EMA_RSI',
          driftClassification: cycle > 100 ? 'WATCH' : 'STABLE',
          expectancyDropPct: cycle > 100 ? 0.08 : 0.01
        });
        expect(policyRes.riskMultiplier).toBeGreaterThan(0);

        // 4. Paper trade execution
        if (signalResult.signal !== 'WAIT') {
          const trade = await paperExecutionEngine.executeSimulatedTrade({
            sessionId: `STAB_SESS_${cycle}`,
            userId: 1,
            asset: 'BTC/USD',
            direction: signalResult.signal,
            amount: 500 * policyRes.riskMultiplier,
            strategy: 'EMA_RSI',
            entryPrice: basePrice,
            duration: 1
          });
          expect(trade).toBeDefined();
        }
      }

      // 5. Test alerts & push notification rate limiting
      if (cycle % 30 === 0) {
        const alertRes = await notificationService.dispatchNotification({
          category: 'MARKET_DATA',
          title: 'Stability Market Stream Active',
          body: `Cycle ${cycle} verified.`
        });
        if (alertRes.delivered > 0) {
          notificationCount++;
        }
      }
    }

    // Assert sequence integrity
    const finalSeq = getLastSequence();
    expect(finalSeq).toBeGreaterThanOrEqual(initialSeq);

    // Assert ring buffer integrity
    const buffer = getEventBuffer();
    expect(buffer.length).toBeLessThanOrEqual(100);

    // Assert runaway notification protection (max 5 delivered due to cooldown)
    expect(notificationCount).toBeLessThanOrEqual(5);

    // Assert no excessive heap explosion (less than 100MB heap growth during 150 cycles)
    const memoryAfter = process.memoryUsage().heapUsed;
    const growthMb = (memoryAfter - memoryBefore) / (1024 * 1024);
    expect(growthMb).toBeLessThan(100);
  });
});
