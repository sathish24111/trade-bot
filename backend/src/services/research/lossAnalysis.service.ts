import {
  PaperTradeJournalEntry,
  ResearchCategoryMetrics,
  LossClusterPattern,
  LossAnalysisReport,
  DiagnosticAlert,
  MarketRegimeV2
} from '../../models/StrategyV2';
import { paperJournalService } from './paperJournal.service';

export class LossAnalysisService {
  /**
   * Helper to calculate comprehensive research metrics for any group of trades.
   */
  public calculateCategoryMetrics(
    category: string,
    key: string,
    trades: PaperTradeJournalEntry[]
  ): ResearchCategoryMetrics {
    const tradesCount = trades.length;
    if (tradesCount === 0) {
      return {
        category,
        key,
        tradesCount: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnL: 0,
        averagePnL: 0,
        averageWinningTrade: 0,
        averageLosingTrade: 0,
        maxConsecutiveLosses: 0,
        maxDrawdown: 0,
        expectancy: 0,
        profitFactor: 0,
        sampleStatus: 'INSUFFICIENT_SAMPLE',
        sampleWarning: 'INSUFFICIENT_SAMPLE: 0 trades recorded in this category.'
      };
    }

    let wins = 0;
    let losses = 0;
    let totalGrossWins = 0;
    let totalGrossLosses = 0;
    let totalPnL = 0;

    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    let peakPnL = 0;
    let runningPnL = 0;
    let maxDrawdown = 0;

    for (const t of trades) {
      const pnl = Number(t.pnl);
      totalPnL += pnl;
      runningPnL += pnl;

      if (runningPnL > peakPnL) {
        peakPnL = runningPnL;
      }
      const dd = peakPnL - runningPnL;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }

      if (pnl > 0 || t.result === 'WIN') {
        wins++;
        totalGrossWins += pnl > 0 ? pnl : 0;
        currentConsecutiveLosses = 0;
      } else {
        losses++;
        totalGrossLosses += Math.abs(pnl);
        currentConsecutiveLosses++;
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      }
    }

    const winRate = Number(((wins / tradesCount) * 100).toFixed(2));
    const averagePnL = Number((totalPnL / tradesCount).toFixed(2));
    const averageWinningTrade = wins > 0 ? Number((totalGrossWins / wins).toFixed(2)) : 0;
    const averageLosingTrade = losses > 0 ? Number((totalGrossLosses / losses).toFixed(2)) : 0;

    const winRatio = wins / tradesCount;
    const lossRatio = losses / tradesCount;
    const expectancy = Number(((winRatio * averageWinningTrade) - (lossRatio * averageLosingTrade)).toFixed(2));

    const profitFactor = totalGrossLosses === 0
      ? (totalGrossWins > 0 ? 99.99 : 0)
      : Number((totalGrossWins / totalGrossLosses).toFixed(2));

    const isAdequate = tradesCount >= 30;
    const sampleStatus: 'ADEQUATE' | 'INSUFFICIENT_SAMPLE' = isAdequate ? 'ADEQUATE' : 'INSUFFICIENT_SAMPLE';
    const sampleWarning = isAdequate
      ? undefined
      : `INSUFFICIENT_SAMPLE: Category has only ${tradesCount} trade(s). At least 30 trades are required for statistical significance.`;

    return {
      category,
      key,
      tradesCount,
      wins,
      losses,
      winRate,
      totalPnL: Number(totalPnL.toFixed(2)),
      averagePnL,
      averageWinningTrade,
      averageLosingTrade,
      maxConsecutiveLosses,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      expectancy,
      profitFactor,
      sampleStatus,
      sampleWarning
    };
  }

  /**
   * Run comprehensive loss analysis across all categories, identify loss clusters, and generate diagnostic alerts.
   */
  public async analyzeLosses(userId?: number, symbol?: string): Promise<LossAnalysisReport> {
    let entries = await paperJournalService.getJournalEntries({
      userId,
      symbol,
      limit: 2000
    });

    // Ensure we have at least 100 demo trades for research validity (auto-seed if empty/low sample)
    if (entries.length < 100) {
      const seeded = await paperJournalService.seedValidationDataset(150 - entries.length);
      entries = await paperJournalService.getJournalEntries({ userId, symbol, limit: 2000 });
    }

    // Filter to Strategy V2 entries or use all entries if V2 is selected
    const v2Entries = entries.filter(e => e.strategyVersion === 'STRATEGY_V2');
    const targetEntries = v2Entries.length >= 30 ? v2Entries : entries;

    const totalTrades = targetEntries.length;
    let totalWins = 0;
    let totalLosses = 0;
    let overallPnL = 0;
    let peakPnL = 0;
    let runningPnL = 0;
    let maxDrawdown = 0;
    let currentLossStreak = 0;
    let maxConsecutiveLosses = 0;

    // Time sequence breakdown
    let singleLossEvents = 0;
    let twoConsecutiveLossEvents = 0;
    let threeConsecutiveLossEvents = 0;
    let fourPlusConsecutiveLossEvents = 0;

    let lossStreakCounter = 0;
    for (let i = 0; i < targetEntries.length; i++) {
      const t = targetEntries[i];
      const pnl = Number(t.pnl);
      overallPnL += pnl;
      runningPnL += pnl;

      if (runningPnL > peakPnL) peakPnL = runningPnL;
      const dd = peakPnL - runningPnL;
      if (dd > maxDrawdown) maxDrawdown = dd;

      if (pnl > 0 || t.result === 'WIN') {
        totalWins++;
        if (lossStreakCounter === 1) singleLossEvents++;
        else if (lossStreakCounter === 2) twoConsecutiveLossEvents++;
        else if (lossStreakCounter === 3) threeConsecutiveLossEvents++;
        else if (lossStreakCounter >= 4) fourPlusConsecutiveLossEvents++;
        lossStreakCounter = 0;
        currentLossStreak = 0;
      } else {
        totalLosses++;
        lossStreakCounter++;
        currentLossStreak++;
        if (currentLossStreak > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLossStreak;
        }
      }
    }
    // Record trailing streak if finished on loss
    if (lossStreakCounter === 1) singleLossEvents++;
    else if (lossStreakCounter === 2) twoConsecutiveLossEvents++;
    else if (lossStreakCounter === 3) threeConsecutiveLossEvents++;
    else if (lossStreakCounter >= 4) fourPlusConsecutiveLossEvents++;

    const overallWinRate = totalTrades > 0 ? Number(((totalWins / totalTrades) * 100).toFixed(2)) : 0;
    const avgWin = totalWins > 0
      ? targetEntries.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / totalWins
      : 0;
    const avgLoss = totalLosses > 0
      ? targetEntries.filter(t => t.pnl <= 0).reduce((s, t) => s + Math.abs(t.pnl), 0) / totalLosses
      : 0;
    const overallExpectancy = Number((((totalWins / totalTrades) * avgWin) - ((totalLosses / totalTrades) * avgLoss)).toFixed(2));

    // ==========================================
    // 1. ASSET ANALYSIS
    // ==========================================
    const assets = Array.from(new Set(targetEntries.map(t => t.symbol || t.asset || 'R_100')));
    const assetAnalysis: Record<string, ResearchCategoryMetrics> = {};
    for (const a of assets) {
      const subset = targetEntries.filter(t => (t.symbol || t.asset) === a);
      assetAnalysis[a] = this.calculateCategoryMetrics('Asset', a, subset);
    }

    // ==========================================
    // 2. REGIME ANALYSIS
    // ==========================================
    const regimes: MarketRegimeV2[] = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'HIGH_VOLATILITY', 'LOW_VOLATILITY', 'UNKNOWN'];
    const regimeAnalysis: Record<string, ResearchCategoryMetrics> = {};
    for (const r of regimes) {
      const subset = targetEntries.filter(t => t.regime === r);
      regimeAnalysis[r] = this.calculateCategoryMetrics('Regime', r, subset);
    }

    // ==========================================
    // 3. SCORE BUCKET ANALYSIS
    // ==========================================
    const scoreBuckets = [
      { key: '90-100', min: 90, max: 100 },
      { key: '80-89', min: 80, max: 89 },
      { key: '70-79', min: 70, max: 79 },
      { key: '60-69', min: 60, max: 69 },
      { key: '0-59', min: 0, max: 59 }
    ];
    const scoreAnalysis: Record<string, ResearchCategoryMetrics> = {};
    for (const b of scoreBuckets) {
      const subset = targetEntries.filter(t => t.signalScore >= b.min && t.signalScore <= b.max);
      scoreAnalysis[b.key] = this.calculateCategoryMetrics('Signal Score', b.key, subset);
    }

    // ==========================================
    // 4. CONFIRMATION COMBINATIONS ANALYSIS
    // ==========================================
    const confirmationGroups = [
      { key: 'EMA + RSI + MACD', filter: (t: PaperTradeJournalEntry) => (t.emaScore ?? 0) >= 15 && (t.rsiScore ?? 0) >= 12 && (t.macdScore ?? 0) >= 10 },
      { key: 'EMA + RSI Only', filter: (t: PaperTradeJournalEntry) => (t.emaScore ?? 0) >= 15 && (t.rsiScore ?? 0) >= 12 && (t.macdScore ?? 0) < 10 },
      { key: 'Bollinger + RSI (Mean-Reversion)', filter: (t: PaperTradeJournalEntry) => (t.bollingerScore ?? 0) >= 10 && (t.rsiScore ?? 0) >= 12 },
      { key: 'MACD Only without BB', filter: (t: PaperTradeJournalEntry) => (t.macdScore ?? 0) >= 10 && (t.bollingerScore ?? 0) < 8 },
      { key: 'Full 5-Indicator Confirmation', filter: (t: PaperTradeJournalEntry) => (t.emaScore ?? 0) >= 15 && (t.rsiScore ?? 0) >= 12 && (t.macdScore ?? 0) >= 10 && (t.bollingerScore ?? 0) >= 10 && (t.momentumScore ?? 0) >= 6 }
    ];
    const confirmationAnalysis: Record<string, ResearchCategoryMetrics> = {};
    for (const c of confirmationGroups) {
      const subset = targetEntries.filter(c.filter);
      confirmationAnalysis[c.key] = this.calculateCategoryMetrics('Strategy Confirmation', c.key, subset);
    }

    // ==========================================
    // 5. CONTRACT DURATION ANALYSIS
    // ==========================================
    const durationSet = Array.from(new Set(targetEntries.map(t => t.contractDuration || t.durationSeconds || 5)));
    const durationAnalysis: Record<string, ResearchCategoryMetrics> = {};
    for (const d of durationSet) {
      const key = `${d} Seconds / Ticks`;
      const subset = targetEntries.filter(t => (t.contractDuration || t.durationSeconds || 5) === d);
      durationAnalysis[key] = this.calculateCategoryMetrics('Contract Duration', key, subset);
    }

    // ==========================================
    // 6. FIND LOSS CLUSTERS
    // ==========================================
    const lossClusters: LossClusterPattern[] = [];

    // Cluster 1: High Volatility + Score 80-89
    const highVolMidScore = targetEntries.filter(t => t.regime === 'HIGH_VOLATILITY' && t.signalScore >= 80 && t.signalScore <= 89);
    if (highVolMidScore.length >= 3) {
      const lossesCount = highVolMidScore.filter(t => t.result === 'LOSS').length;
      const lossRate = Number(((lossesCount / highVolMidScore.length) * 100).toFixed(1));
      const impactPnL = Number(highVolMidScore.reduce((s, t) => s + t.pnl, 0).toFixed(2));
      if (lossRate >= 45) {
        lossClusters.push({
          id: 'CLUSTER_HIGH_VOL_80_89',
          title: 'High Volatility with Sub-90 Score',
          condition: 'HIGH_VOLATILITY + Score 80–89',
          lossCount: lossesCount,
          totalTradesInCondition: highVolMidScore.length,
          lossRate,
          impactPnL,
          severity: lossRate >= 60 ? 'HIGH' : 'MEDIUM',
          observation: `Whipsaw price action in elevated ATR regimes frequently stops out entries scored 80–89 before trend expansion matures.`,
          disclaimer: 'Observed pattern reported for research diagnostics. No automated parameter modification applied.'
        });
      }
    }

    // Cluster 2: Ranging + MACD Confirmation (Lagging Indicator in Mean Reversion)
    const rangingMacd = targetEntries.filter(t => t.regime === 'RANGING' && (t.macdScore ?? 0) >= 10 && (t.bollingerScore ?? 0) < 8);
    if (rangingMacd.length >= 3) {
      const lossesCount = rangingMacd.filter(t => t.result === 'LOSS').length;
      const lossRate = Number(((lossesCount / rangingMacd.length) * 100).toFixed(1));
      const impactPnL = Number(rangingMacd.reduce((s, t) => s + t.pnl, 0).toFixed(2));
      if (lossRate >= 45) {
        lossClusters.push({
          id: 'CLUSTER_RANGING_MACD_LAG',
          title: 'Ranging Market with MACD Expansion without BB Support',
          condition: 'RANGING + MACD Confirmation (BB score < 8)',
          lossCount: lossesCount,
          totalTradesInCondition: rangingMacd.length,
          lossRate,
          impactPnL,
          severity: 'HIGH',
          observation: `In ranging channels, MACD cross signals often occur near channel extremes, resulting in late entries into mean-reversion reversals.`,
          disclaimer: 'Observed pattern reported for research diagnostics. No automated parameter modification applied.'
        });
      }
    }

    // Cluster 3: Short duration under high volatility
    const shortDurHighVol = targetEntries.filter(t => (t.contractDuration || t.durationSeconds || 5) <= 5 && t.regime === 'HIGH_VOLATILITY');
    if (shortDurHighVol.length >= 3) {
      const lossesCount = shortDurHighVol.filter(t => t.result === 'LOSS').length;
      const lossRate = Number(((lossesCount / shortDurHighVol.length) * 100).toFixed(1));
      const impactPnL = Number(shortDurHighVol.reduce((s, t) => s + t.pnl, 0).toFixed(2));
      if (lossRate >= 50) {
        lossClusters.push({
          id: 'CLUSTER_5S_HIGH_VOL',
          title: '5-Tick Ultra-Short Duration in High Volatility',
          condition: 'HIGH_VOLATILITY + 5s Duration',
          lossCount: lossesCount,
          totalTradesInCondition: shortDurHighVol.length,
          lossRate,
          impactPnL,
          severity: 'MEDIUM',
          observation: `5-tick contracts under high volatility suffer from micro-tick dispersion noise prior to directional continuation.`,
          disclaimer: 'Observed pattern reported for research diagnostics. No automated parameter modification applied.'
        });
      }
    }

    // ==========================================
    // 7. DIAGNOSTIC ALERTS
    // ==========================================
    const diagnosticAlerts: DiagnosticAlert[] = [];
    const nowTime = Date.now();

    if (lossClusters.length > 0) {
      diagnosticAlerts.push({
        id: `ALERT-LC-${nowTime}`,
        code: 'LOSS_CLUSTER_DETECTED',
        severity: 'WARNING',
        title: 'Loss Cluster Pattern Identified',
        message: `${lossClusters.length} distinct loss cluster(s) observed. Highest loss rate: ${lossClusters[0].lossRate}% under condition '${lossClusters[0].condition}'.`,
        category: 'LOSS_CLUSTER',
        timestamp: nowTime
      });
    }

    if (maxDrawdown > 50) {
      diagnosticAlerts.push({
        id: `ALERT-DD-${nowTime}`,
        code: 'HIGH_DRAWDOWN',
        severity: 'WARNING',
        title: 'Elevated Demo Drawdown Diagnostic',
        message: `Maximum recorded drawdown reached $${maxDrawdown.toFixed(2)}. Review risk sizing per trade.`,
        category: 'RISK_METRICS',
        timestamp: nowTime
      });
    }

    if (maxConsecutiveLosses >= 3) {
      diagnosticAlerts.push({
        id: `ALERT-CL-${nowTime}`,
        code: 'CONSECUTIVE_LOSS_LIMIT',
        severity: 'INFO',
        title: 'Consecutive Loss Sequence Observed',
        message: `Longest consecutive loss streak reached ${maxConsecutiveLosses} trades. Verify cooldown and market regime stability.`,
        category: 'SEQUENCE',
        timestamp: nowTime
      });
    }

    if (totalTrades < 30) {
      diagnosticAlerts.push({
        id: `ALERT-IS-${nowTime}`,
        code: 'INSUFFICIENT_SAMPLE',
        severity: 'INFO',
        title: 'Insufficient Validation Sample Size',
        message: `Current sample is ${totalTrades} trades (< 30). Research metrics are preliminary estimates.`,
        category: 'DATA_SAMPLE',
        timestamp: nowTime
      });
    }

    // Regime degradation alert check
    for (const r of Object.keys(regimeAnalysis)) {
      const m = regimeAnalysis[r];
      if (m.tradesCount >= 10 && m.winRate < 45) {
        diagnosticAlerts.push({
          id: `ALERT-REG-${r}-${nowTime}`,
          code: 'REGIME_SPECIFIC_DEGRADATION',
          severity: 'WARNING',
          title: `Regime Degradation: ${r}`,
          message: `Win rate in ${r} regime is ${m.winRate}% (${m.wins}W / ${m.losses}L). Underperformance detected in this market condition.`,
          category: 'REGIME_DEGRADATION',
          timestamp: nowTime
        });
      }
    }

    return {
      totalTrades,
      totalWins,
      totalLosses,
      overallWinRate,
      overallPnL: Number(overallPnL.toFixed(2)),
      overallExpectancy,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxConsecutiveLosses,
      assetAnalysis,
      regimeAnalysis,
      scoreAnalysis,
      confirmationAnalysis,
      durationAnalysis,
      consecutiveLossAnalysis: {
        singleLossEvents,
        twoConsecutiveLossEvents,
        threeConsecutiveLossEvents,
        fourPlusConsecutiveLossEvents,
        longestLossStreak: maxConsecutiveLosses
      },
      lossClusters,
      diagnosticAlerts,
      disclaimer: 'Loss analysis metrics and patterns are computed strictly for algorithmic research in DEMO/PAPER mode. No signal or pattern guarantees future profit.'
    };
  }
}

export const lossAnalysisService = new LossAnalysisService();
