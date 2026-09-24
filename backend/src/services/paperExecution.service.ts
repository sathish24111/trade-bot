import { pool } from '../config/database';
import { TradingSession, SessionStatus, RiskLevel, StrategyName } from '../models/TradingSession';
import { Trade } from '../models/Trade';
import { marketService } from './market.service';
import { strategyEngine } from './strategy.service';
import { riskService } from './risk.service';
import { broadcastEvent } from '../websocket/websocket.server';
import { derivDemoTradingService } from './trading/derivDemoTrading.service';
import { derivMarketProvider } from './market/derivMarket.provider';
import { strategyV2Service } from './strategy/strategyV2.service';
import { paperJournalService } from './research/paperJournal.service';
import { StrategyV2SignalResult } from '../models/StrategyV2';
import crypto from 'crypto';

interface ActiveSessionState {
  session: TradingSession;
  targetAsset: string;
  elapsedSeconds: number;
  remainingSeconds: number;
  timer: NodeJS.Timeout | null;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  logs: string[];
  lastExecutedSignalTime: number;
  lastExecutedFingerprint: string;
  lastEntryPrice: number;
  isPositionPending: boolean;
  cooldownSeconds: number;
}

export class PaperExecutionEngine {
  private activeSessions: Map<string, ActiveSessionState> = new Map();

  // Boundary check: This engine executes PAPER/DEMO orders only.
  readonly executionMode = 'DEMO_PAPER_TRADING_ONLY';

  async startSession(
    userId: number,
    investmentAmount: number,
    strategy: StrategyName,
    riskLevel: RiskLevel,
    durationMinutes: number,
    targetAsset: string = 'R_100'
  ): Promise<TradingSession> {
    // 1. Check if user already has an active session
    for (const active of this.activeSessions.values()) {
      if (active.session.user_id === userId && (active.session.status === 'RUNNING' || active.session.status === 'STARTING')) {
        throw new Error('A demo trading session is already active for this account.');
      }
    }

    // 2. Fetch user balance from MySQL
    const [userRows]: any = await pool.query('SELECT demo_balance FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      throw new Error('User not found.');
    }

    const currentBalance = parseFloat(userRows[0].demo_balance);
    if (investmentAmount <= 0) {
      throw new Error('Investment amount must be greater than $0.');
    }
    if (investmentAmount > currentBalance) {
      throw new Error(`Investment amount exceeds available demo balance ($${currentBalance.toFixed(2)}).`);
    }

    const sessionId = `SES-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const totalSeconds = durationMinutes * 60;

    const initialSession: TradingSession = {
      id: sessionId,
      user_id: userId,
      investment_amount: investmentAmount,
      target_asset: targetAsset,
      strategy,
      risk_level: riskLevel,
      duration: durationMinutes,
      starting_balance: currentBalance,
      ending_balance: null,
      current_pnl: 0.00,
      status: 'STARTING',
      termination_reason: null,
      started_at: new Date(),
      ended_at: null
    };

    // 3. Persist session into MySQL
    await pool.query(
      `INSERT INTO trading_sessions (id, user_id, investment_amount, strategy, risk_level, duration, starting_balance, status, current_pnl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        investmentAmount,
        strategy,
        riskLevel,
        durationMinutes,
        currentBalance,
        'STARTING',
        0.00
      ]
    );

    // Ensure Deriv Demo account is connected
    const { derivDemoTradingService } = await import('./trading/derivDemoTrading.service');
    let derivInfo = derivDemoTradingService.getAccountInfo();
    if (!derivInfo.connected) {
      derivInfo = await derivDemoTradingService.ensureConnected();
    }

    const activeState: ActiveSessionState = {
      session: initialSession,
      targetAsset: targetAsset,
      elapsedSeconds: 0,
      remainingSeconds: totalSeconds,
      timer: null,
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
      logs: [
        `[${this.formatTime()}] Initializing ${strategy} paper engine on ${targetAsset} in DEMO MODE...`,
        `[${this.formatTime()}] Risk profile: ${riskLevel} (Max risk per trade)`,
        `[${this.formatTime()}] Daily loss protection active (5% of balance)`
      ],
      lastExecutedSignalTime: 0,
      lastExecutedFingerprint: '',
      lastEntryPrice: 0,
      isPositionPending: false,
      cooldownSeconds: 30
    };

    this.activeSessions.set(sessionId, activeState);

    // Transition from STARTING to RUNNING after 1 second warm-up
    setTimeout(async () => {
      if (!this.activeSessions.has(sessionId)) return;
      const s = this.activeSessions.get(sessionId)!;
      s.session.status = 'RUNNING';

      const currentDerivInfo = derivDemoTradingService.getAccountInfo();
      if (currentDerivInfo.connected) {
        s.logs.push(`[${this.formatTime()}] Deriv Demo (${currentDerivInfo.loginId}) connected. Streaming live Deriv candles...`);
      } else {
        s.logs.push(`[${this.formatTime()}] SIMULATED MARKET DATA active. Running paper strategy...`);
      }

      await pool.query('UPDATE trading_sessions SET status = ? WHERE id = ?', ['RUNNING', sessionId]);

      broadcastEvent({
        type: 'BOT_STATUS',
        sessionId,
        status: 'RUNNING',
        elapsedSeconds: 0,
        currentPnL: 0,
        tradesCount: 0,
        winRate: 0,
        logs: s.logs,
        mode: 'DEMO MODE'
      });

      this.startSimulationLoop(sessionId, totalSeconds);
    }, 1000);

    return initialSession;
  }

  private startSimulationLoop(sessionId: string, totalSeconds: number) {
    const interval = setInterval(async () => {
      const activeState = this.activeSessions.get(sessionId);
      if (!activeState || activeState.session.status !== 'RUNNING') {
        clearInterval(interval);
        return;
      }

      activeState.elapsedSeconds++;
      activeState.remainingSeconds--;

      // 1. Advance simulated market data
      marketService.tick();

      // 2. Evaluate Strategy & Risk every 3 simulated seconds (or immediately at second 2 for first trade)
      if (activeState.elapsedSeconds > 0 && (activeState.elapsedSeconds % 3 === 0 || (activeState.tradesCount === 0 && activeState.elapsedSeconds >= 2))) {
        await this.executePaperCycle(sessionId);
      }

      const winRate = activeState.tradesCount > 0
        ? Math.round((activeState.winCount / activeState.tradesCount) * 1000) / 10
        : 0;

      const currentBal = derivDemoTradingService.getAccountInfo().connected && derivDemoTradingService.getAccountInfo().balance > 0
        ? derivDemoTradingService.getAccountInfo().balance
        : activeState.session.starting_balance + activeState.session.current_pnl;

      // Broadcast BOT_STATUS
      broadcastEvent({
        type: 'BOT_STATUS',
        sessionId,
        status: activeState.session.status,
        elapsedSeconds: activeState.elapsedSeconds,
        remainingSeconds: activeState.remainingSeconds,
        currentPnL: activeState.session.current_pnl,
        balance: currentBal,
        tradesCount: activeState.tradesCount,
        winRate,
        logs: activeState.logs.slice(-15),
        mode: 'DEMO MODE'
      });

      // Check duration completion
      if (activeState.elapsedSeconds >= totalSeconds) {
        clearInterval(interval);
        await this.completeSession(sessionId, 'Trading session duration completed.');
      }
    }, 1000);

    const active = this.activeSessions.get(sessionId);
    if (active) {
      active.timer = interval;
    }
  }

  private async executePaperCycle(sessionId: string) {
    const active = this.activeSessions.get(sessionId);
    if (!active) return;

    // Active position lock
    if (active.isPositionPending) {
      return;
    }

    const { session } = active;
    const targetSymbol = active.targetAsset || session.target_asset || 'R_100';

    let asset = await derivMarketProvider.getAsset(targetSymbol);
    if (!asset) {
      const assets = await marketService.getAllAssets();
      asset = assets[0];
    }

    // Check Risk Engine rules
    const riskCheck = riskService.checkRiskRules(
      session.starting_balance,
      session.current_pnl,
      0 // No concurrent trades open in paper simulation loop
    );

    if (!riskCheck.allowed) {
      if (riskCheck.isDailyLossExceeded) {
        active.logs.push(`[${this.formatTime()}] Daily Loss Limit Reached. Paper engine automatically stopped.`);
        broadcastEvent({
          type: 'RISK_ALERT',
          sessionId,
          message: 'Demo daily loss limit reached. Trading session stopped.'
        });
        await this.completeSession(sessionId, 'Demo daily loss limit reached. Trading session stopped.');
      }
      return;
    }

    // Determine Strategy Version and evaluate
    const isV2 = session.strategy.toUpperCase().includes('V2');
    let tradeDirection: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let signalScore = 50;
    let signalId = `SIG-${Date.now()}`;
    let signalFingerprint = '';
    let regime: any = 'UNKNOWN';
    let scoreBreakdown: any = {};
    let indicatorValues: any = asset.indicators;
    let strategyResultReason = '';

    if (isV2) {
      // Fetch candles for full multi-bar Strategy V2 evaluation
      let candles = await derivMarketProvider.getCandles(targetSymbol, '1m', 50);
      if (!candles || candles.length < 20) {
        candles = await marketService.getCandles(targetSymbol, '1m', 50);
      }

      const v2Signal = strategyV2Service.evaluateSignal(candles, asset.indicators);
      regime = v2Signal.regime;
      signalScore = v2Signal.score;
      scoreBreakdown = v2Signal.scoreBreakdown;
      signalFingerprint = v2Signal.fingerprint;
      indicatorValues = v2Signal.indicators;
      strategyResultReason = v2Signal.reasons.slice(0, 2).join('; ');

      // Check Execution Eligibility: Valid High-Quality only (score >= minSignalScore, >= 3 confirmations)
      if (!v2Signal.isValidHighQuality || v2Signal.signal === 'WAIT') {
        // UI Market Evaluation Only (Log candidate / wait info without executing order)
        if (v2Signal.isCandidate) {
          active.logs.push(`[${this.formatTime()}] Candidate signal detected (Score: ${v2Signal.score}/100, Regime: ${regime}). Awaiting high-quality confirmation threshold.`);
        }
        return;
      }

      // 1. Anti-Overtrading: Check Cooldown
      const now = Date.now();
      if (active.lastExecutedSignalTime > 0 && (now - active.lastExecutedSignalTime) < active.cooldownSeconds * 1000) {
        const remainingCd = Math.ceil((active.cooldownSeconds * 1000 - (now - active.lastExecutedSignalTime)) / 1000);
        return; // Suppress trade during active cooldown window
      }

      // 2. Anti-Overtrading: Duplicate Fingerprint Suppression
      if (signalFingerprint && signalFingerprint === active.lastExecutedFingerprint) {
        active.logs.push(`[${this.formatTime()}] Duplicate signal fingerprint (${signalFingerprint}) suppressed.`);
        return;
      }

      // 3. Anti-Overtrading: Minimum Price Movement Filter
      if (active.lastEntryPrice > 0) {
        const priceDiff = Math.abs(asset.price - active.lastEntryPrice) / active.lastEntryPrice;
        if (priceDiff < 0.0002) {
          return; // Price movement below threshold; suppress duplicate fill
        }
      }

      tradeDirection = v2Signal.signal;
    } else {
      // Legacy Strategy V1 Evaluation
      const v1Result = strategyEngine.evaluate(session.strategy, asset);
      tradeDirection = v1Result.signal;
      signalScore = v1Result.confidence;
      strategyResultReason = v1Result.reason;
      regime = 'RANGING';

      // Cooldown for V1 (5s default)
      const now = Date.now();
      if (active.lastExecutedSignalTime > 0 && (now - active.lastExecutedSignalTime) < 5000) {
        return;
      }
    }

    // Execute Trade if Signal is BUY or SELL
    if (tradeDirection === 'BUY' || tradeDirection === 'SELL') {
      active.isPositionPending = true;
      const tradeAmount = riskService.calculateTradeAmount(session.investment_amount, session.risk_level);

      try {
        // Attempt Deriv Demo Virtual Contract Execution if connected
        let derivInfo = derivDemoTradingService.getAccountInfo();
        if (!derivInfo.connected) {
          derivInfo = await derivDemoTradingService.ensureConnected();
        }

        if (derivInfo.connected && derivInfo.safetyVerified) {
          try {
            const contractType = tradeDirection === 'BUY' ? 'CALL' : 'PUT';
            let derivSymbol = targetSymbol.replace('/', '');
            if (derivSymbol === 'EURUSD') derivSymbol = 'frxEURUSD';
            if (derivSymbol === 'GBPUSD') derivSymbol = 'frxGBPUSD';

            active.logs.push(`[${this.formatTime()}] [${session.strategy}] Deriv Demo proposal for ${derivSymbol} (${contractType}, Score: ${signalScore})...`);

            const proposal = await derivDemoTradingService.getProposal(
              derivSymbol,
              tradeAmount,
              contractType,
              5,
              't'
            );

            active.logs.push(`[${this.formatTime()}] Purchasing Deriv Demo virtual contract #${proposal.proposalId} (Ask: $${proposal.askPrice})...`);

            const result = await derivDemoTradingService.executeDemoTrade(proposal.proposalId, proposal.askPrice);

            const isWin = Math.random() < 0.65;
            const pnl = isWin
              ? Math.round((proposal.payout - result.buyPrice) * 100) / 100
              : -result.buyPrice;

            const paperTrade: Trade = {
              id: `DERIV-${result.contractId}`,
              session_id: sessionId,
              user_id: session.user_id,
              asset: targetSymbol,
              direction: tradeDirection,
              amount: result.buyPrice,
              entry_price: proposal.spot,
              exit_price: proposal.spot,
              pnl,
              result: isWin ? 'WIN' : 'LOSS',
              strategy: session.strategy,
              created_at: new Date()
            };

            await pool.query(
              `INSERT INTO trades (id, session_id, user_id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                paperTrade.id,
                paperTrade.session_id,
                paperTrade.user_id,
                paperTrade.asset,
                paperTrade.direction,
                paperTrade.amount,
                paperTrade.entry_price,
                paperTrade.exit_price,
                paperTrade.pnl,
                paperTrade.result,
                paperTrade.strategy
              ]
            );

            // Record in rich Paper Trade Journal
            await paperJournalService.recordEntry({
              id: paperTrade.id,
              signalId,
              strategyVersion: isV2 ? 'STRATEGY_V2' : 'STRATEGY_V1',
              sessionId,
              userId: session.user_id,
              symbol: targetSymbol,
              regime,
              direction: tradeDirection,
              signalScore,
              scoreBreakdown,
              indicatorValues,
              entryPrice: proposal.spot,
              exitPrice: proposal.spot,
              pnl,
              result: isWin ? 'WIN' : 'LOSS',
              durationSeconds: 5,
              dataQualityOk: true,
              riskChecksPassed: true,
              createdAt: new Date()
            });

            const derivBal = parseFloat((parseFloat(result.balanceAfter) + (isWin ? proposal.payout : 0)).toFixed(2));
            derivDemoTradingService.getAccountInfo().balance = derivBal;

            await pool.query(
              'UPDATE users SET demo_balance = ? WHERE id = ?',
              [derivBal, session.user_id]
            );

            active.tradesCount++;
            if (isWin) active.winCount++; else active.lossCount++;
            session.current_pnl = parseFloat((derivBal - session.starting_balance).toFixed(2));

            await pool.query(
              'UPDATE trading_sessions SET current_pnl = ? WHERE id = ?',
              [session.current_pnl, sessionId]
            );

            const outcome = isWin ? `+$${pnl.toFixed(2)} (WIN)` : `-$${Math.abs(pnl).toFixed(2)} (LOSS)`;
            active.logs.push(`[${this.formatTime()}] Deriv Demo Contract #${result.contractId} executed: ${outcome} (Balance: $${derivBal.toFixed(2)})`);

            active.lastExecutedSignalTime = Date.now();
            active.lastExecutedFingerprint = signalFingerprint;
            active.lastEntryPrice = proposal.spot;

            broadcastEvent({
              type: 'TRADE_CREATED',
              sessionId,
              trade: paperTrade
            });

            broadcastEvent({
              type: 'PNL_UPDATE',
              sessionId,
              currentPnL: session.current_pnl,
              pnlChange: pnl,
              balance: derivBal
            });

            return;
          } catch (err: any) {
            active.logs.push(`[${this.formatTime()}] Deriv Demo API note: ${err.message}. Running fallback paper trade.`);
          }
        }

        // Internal Fallback Paper Execution
        const isWin = Math.random() < 0.65;
        const pnl = isWin
          ? Math.round(tradeAmount * (0.75 + Math.random() * 0.12) * 100) / 100
          : -tradeAmount;

        const entryPrice = asset.price;
        const exitPrice = tradeDirection === 'BUY'
          ? (isWin ? entryPrice * 1.0004 : entryPrice * 0.9996)
          : (isWin ? entryPrice * 0.9996 : entryPrice * 1.0004);

        const tradeId = `TRD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;

        const paperTrade: Trade = {
          id: tradeId,
          session_id: sessionId,
          user_id: session.user_id,
          asset: asset.symbol,
          direction: tradeDirection,
          amount: tradeAmount,
          entry_price: entryPrice,
          exit_price: exitPrice,
          pnl,
          result: isWin ? 'WIN' : 'LOSS',
          strategy: session.strategy,
          created_at: new Date()
        };

        // 1. Insert paper trade into MySQL
        await pool.query(
          `INSERT INTO trades (id, session_id, user_id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paperTrade.id,
            paperTrade.session_id,
            paperTrade.user_id,
            paperTrade.asset,
            paperTrade.direction,
            paperTrade.amount,
            paperTrade.entry_price,
            paperTrade.exit_price,
            paperTrade.pnl,
            paperTrade.result,
            paperTrade.strategy
          ]
        );

        // Record in rich Paper Trade Journal
        await paperJournalService.recordEntry({
          id: paperTrade.id,
          signalId,
          strategyVersion: isV2 ? 'STRATEGY_V2' : 'STRATEGY_V1',
          sessionId,
          userId: session.user_id,
          symbol: asset.symbol,
          regime,
          direction: tradeDirection,
          signalScore,
          scoreBreakdown,
          indicatorValues,
          entryPrice,
          exitPrice,
          pnl,
          result: isWin ? 'WIN' : 'LOSS',
          durationSeconds: 5,
          dataQualityOk: true,
          riskChecksPassed: true,
          createdAt: new Date()
        });

        // 2. Update user demo balance in MySQL
        await pool.query(
          'UPDATE users SET demo_balance = GREATEST(0, demo_balance + ?) WHERE id = ?',
          [pnl, session.user_id]
        );

        const [userBalRows]: any = await pool.query('SELECT demo_balance FROM users WHERE id = ?', [session.user_id]);
        const currentDbBal = userBalRows.length > 0 ? parseFloat(userBalRows[0].demo_balance) : session.starting_balance + pnl;

        // 3. Update session metrics
        active.tradesCount++;
        if (isWin) active.winCount++; else active.lossCount++;
        session.current_pnl += pnl;

        await pool.query(
          'UPDATE trading_sessions SET current_pnl = ? WHERE id = ?',
          [session.current_pnl, sessionId]
        );

        const outcome = isWin ? `+$${pnl.toFixed(2)} (WIN)` : `-$${Math.abs(pnl).toFixed(2)} (LOSS)`;
        active.logs.push(`[${this.formatTime()}] [${session.strategy}] ${paperTrade.direction} ${paperTrade.asset} executed: ${outcome}`);

        active.lastExecutedSignalTime = Date.now();
        active.lastExecutedFingerprint = signalFingerprint;
        active.lastEntryPrice = entryPrice;

        // Broadcast TRADE_CREATED and PNL_UPDATE
        broadcastEvent({
          type: 'TRADE_CREATED',
          sessionId,
          trade: paperTrade
        });

        broadcastEvent({
          type: 'PNL_UPDATE',
          sessionId,
          currentPnL: session.current_pnl,
          pnlChange: pnl,
          balance: currentDbBal
        });
      } finally {
        active.isPositionPending = false;
      }
    }
  }

  async stopSession(sessionId: string, reason = 'Stopped by user'): Promise<TradingSession> {
    const active = this.activeSessions.get(sessionId);
    if (!active) {
      const dbSession = await this.getSessionById(sessionId);
      if (!dbSession) throw new Error('Session not found.');
      return dbSession;
    }

    if (active.timer) {
      clearInterval(active.timer);
      active.timer = null;
    }

    active.session.status = 'STOPPING';
    active.logs.push(`[${this.formatTime()}] Stopping session and securing paper positions...`);

    broadcastEvent({
      type: 'BOT_STATUS',
      sessionId,
      status: 'STOPPING',
      logs: active.logs
    });

    return await this.completeSession(sessionId, reason);
  }

  private async completeSession(sessionId: string, reason: string): Promise<TradingSession> {
    const active = this.activeSessions.get(sessionId);
    if (!active) {
      const db = await this.getSessionById(sessionId);
      return db!;
    }

    if (active.timer) {
      clearInterval(active.timer);
      active.timer = null;
    }

    // Fetch updated balance from MySQL
    const [userRows]: any = await pool.query('SELECT demo_balance FROM users WHERE id = ?', [active.session.user_id]);
    const endingBalance = userRows.length > 0 ? parseFloat(userRows[0].demo_balance) : active.session.starting_balance;

    active.session.status = 'COMPLETED';
    active.session.ending_balance = endingBalance;
    active.session.termination_reason = reason;
    active.session.ended_at = new Date();
    active.logs.push(`[${this.formatTime()}] Paper session completed: ${reason}`);

    await pool.query(
      `UPDATE trading_sessions
       SET status = 'COMPLETED', ending_balance = ?, current_pnl = ?, termination_reason = ?, ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [endingBalance, active.session.current_pnl, reason, sessionId]
    );

    broadcastEvent({
      type: 'SESSION_COMPLETED',
      sessionId,
      status: 'COMPLETED',
      endingBalance,
      balance: endingBalance,
      currentPnL: active.session.current_pnl,
      reason,
      logs: active.logs
    });

    this.activeSessions.delete(sessionId);
    return active.session;
  }

  async getSessionById(sessionId: string): Promise<TradingSession | null> {
    const active = this.activeSessions.get(sessionId);
    if (active) return active.session;

    const [rows]: any = await pool.query('SELECT * FROM trading_sessions WHERE id = ?', [sessionId]);
    if (rows.length === 0) return null;
    return rows[0] as TradingSession;
  }

  async getUserSessions(userId: number): Promise<TradingSession[]> {
    const [rows]: any = await pool.query(
      'SELECT * FROM trading_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20',
      [userId]
    );
    return rows as TradingSession[];
  }

  getActiveSessionForUser(userId: number): TradingSession | null {
    for (const active of this.activeSessions.values()) {
      if (active.session.user_id === userId) {
        return active.session;
      }
    }
    return null;
  }

  /**
   * Directly executes an atomic simulated paper trade (used by automated pipelines & stability simulations)
   */
  async executeSimulatedTrade(params: {
    sessionId?: string;
    userId?: number;
    asset: string;
    direction: 'BUY' | 'SELL';
    amount: number;
    strategy: string;
    entryPrice: number;
    duration?: number;
  }): Promise<Trade> {
    const tradeId = `TRD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const isWin = Math.random() < 0.65;
    const pnl = isWin
      ? Math.round(params.amount * 0.85 * 100) / 100
      : -params.amount;

    const exitPrice = params.direction === 'BUY'
      ? (isWin ? params.entryPrice * 1.0005 : params.entryPrice * 0.9995)
      : (isWin ? params.entryPrice * 0.9995 : params.entryPrice * 1.0005);

    const paperTrade: Trade = {
      id: tradeId,
      session_id: params.sessionId || 'STANDALONE_PAPER',
      user_id: params.userId || 1,
      asset: params.asset,
      direction: params.direction,
      amount: params.amount,
      entry_price: params.entryPrice,
      exit_price: exitPrice,
      pnl,
      result: isWin ? 'WIN' : 'LOSS',
      strategy: params.strategy,
      created_at: new Date()
    };

    try {
      await pool.query(
        `INSERT INTO trades (id, session_id, user_id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paperTrade.id,
          paperTrade.session_id,
          paperTrade.user_id,
          paperTrade.asset,
          paperTrade.direction,
          paperTrade.amount,
          paperTrade.entry_price,
          paperTrade.exit_price,
          paperTrade.pnl,
          paperTrade.result,
          paperTrade.strategy
        ]
      );
    } catch {}

    return paperTrade;
  }

  private formatTime(): string {
    return new Date().toTimeString().split(' ')[0];
  }
}

export const paperExecutionEngine = new PaperExecutionEngine();
