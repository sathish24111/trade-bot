import { Candle, DemoSignalType } from '../../models/MarketData';
import { ReplaySessionState, ReplaySpeed, ReplayStatus } from '../../models/Phase8';
import { marketService } from '../market.service';
import { strategyEngine } from '../strategy.service';
import { broadcastEvent } from '../../websocket/websocket.server';

export class PaperReplayService {
  private activeReplays: Map<string, {
    state: ReplaySessionState;
    candles: Candle[];
    timer: NodeJS.Timeout | null;
  }> = new Map();

  /**
   * Initializes a paper trade replay session with historical candles
   */
  async initReplay(params: {
    experimentId: string;
    asset?: string;
    timeframe?: string;
    speed?: ReplaySpeed;
    candlesCount?: number;
  }): Promise<ReplaySessionState> {
    const asset = params.asset || 'BTC/USD';
    const timeframe = params.timeframe || '5m';
    const candlesCount = params.candlesCount || 60;
    const speed = params.speed || 1;

    const candles = await marketService.getCandles(asset, timeframe, candlesCount);
    const sessionId = `REPLAY_${params.experimentId}_${Date.now()}`;

    const state: ReplaySessionState = {
      sessionId,
      experimentId: params.experimentId,
      currentIndex: Math.min(10, candles.length - 1), // start with at least 10 bars for indicator warm-up
      totalBars: candles.length,
      currentBarTimestamp: candles.length > 0 ? new Date(candles[0].timestamp).toISOString() : new Date().toISOString(),
      speed,
      status: 'IDLE',
      currentPrice: candles.length > 0 ? candles[0].close : 65000,
      activeSignals: ['WAIT'],
      simulatedTrades: []
    };

    this.activeReplays.set(sessionId, {
      state,
      candles,
      timer: null
    });

    return state;
  }

  /**
   * Advances replay by one step (Next Bar) with strict anti-lookahead isolation
   */
  stepNext(sessionId: string): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);

    if (session.state.currentIndex < session.candles.length - 1) {
      session.state.currentIndex++;
      const curCandle = session.candles[session.state.currentIndex];
      session.state.currentPrice = curCandle.close;
      session.state.currentBarTimestamp = new Date(curCandle.timestamp).toISOString();

      // Evaluate strategy strictly on bars up to current bar (NO FUTURE LEAKAGE)
      const visibleCandles = session.candles.slice(0, session.state.currentIndex + 1);
      const stratResult = strategyEngine.evaluateFromCandles('EMA_RSI', visibleCandles);
      session.state.activeSignals = [stratResult.signal];

      if (stratResult.signal !== 'WAIT') {
        session.state.simulatedTrades.push({
          bar: session.state.currentIndex,
          signal: stratResult.signal,
          price: curCandle.close,
          timestamp: session.state.currentBarTimestamp
        });
      }

      this.broadcastUpdate(session.state);
    } else {
      session.state.status = 'COMPLETED';
      if (session.timer) {
        clearInterval(session.timer);
        session.timer = null;
      }
    }

    return { ...session.state };
  }

  /**
   * Steps back by one bar
   */
  stepPrevious(sessionId: string): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);

    if (session.state.currentIndex > 10) {
      session.state.currentIndex--;
      const curCandle = session.candles[session.state.currentIndex];
      session.state.currentPrice = curCandle.close;
      session.state.currentBarTimestamp = new Date(curCandle.timestamp).toISOString();
      session.state.status = 'PAUSED';
      if (session.timer) {
        clearInterval(session.timer);
        session.timer = null;
      }
      this.broadcastUpdate(session.state);
    }

    return { ...session.state };
  }

  /**
   * Plays the replay at configured speed (1x, 2x, 5x, 10x)
   */
  play(sessionId: string, speed?: ReplaySpeed): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);

    if (speed) session.state.speed = speed;
    session.state.status = 'PLAYING';

    if (session.timer) clearInterval(session.timer);

    // Base interval is 1000ms / speed
    const intervalMs = Math.max(100, Math.round(1000 / session.state.speed));

    session.timer = setInterval(() => {
      if (session.state.status !== 'PLAYING') {
        if (session.timer) clearInterval(session.timer);
        return;
      }

      if (session.state.currentIndex >= session.candles.length - 1) {
        session.state.status = 'COMPLETED';
        if (session.timer) clearInterval(session.timer);
        return;
      }

      this.stepNext(sessionId);
    }, intervalMs);

    return { ...session.state };
  }

  /**
   * Pauses replay
   */
  pause(sessionId: string): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);

    session.state.status = 'PAUSED';
    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }

    return { ...session.state };
  }

  /**
   * Resets replay to initial index
   */
  reset(sessionId: string): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);

    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }

    session.state.currentIndex = Math.min(10, session.candles.length - 1);
    session.state.status = 'IDLE';
    session.state.simulatedTrades = [];
    if (session.candles.length > 0) {
      session.state.currentPrice = session.candles[session.state.currentIndex].close;
      session.state.currentBarTimestamp = new Date(session.candles[session.state.currentIndex].timestamp).toISOString();
    }

    this.broadcastUpdate(session.state);
    return { ...session.state };
  }

  getState(sessionId: string): ReplaySessionState {
    const session = this.activeReplays.get(sessionId);
    if (!session) throw new Error(`Replay session ${sessionId} not found`);
    return { ...session.state };
  }

  private broadcastUpdate(state: ReplaySessionState) {
    try {
      broadcastEvent({
        type: 'REPLAY_UPDATE',
        sessionId: state.sessionId,
        currentIndex: state.currentIndex,
        totalBars: state.totalBars,
        price: state.currentPrice,
        timestamp: state.currentBarTimestamp,
        speed: state.speed,
        status: state.status,
        mode: 'PAPER'
      });
    } catch {}
  }
}

export const paperReplayService = new PaperReplayService();
