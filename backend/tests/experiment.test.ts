import { experimentService } from '../src/services/research/experiment.service';

describe('Paper Trading Experiments & Journal Tests', () => {
  it('computes deterministic SHA-256 configuration hash and locks setup', () => {
    const hash1 = experimentService.computeConfigHash({
      userId: 1,
      name: 'Alpha Test',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      parameters: { fastEmaPeriod: 9, slowEmaPeriod: 21 },
      startBalance: 10000
    });

    const hash2 = experimentService.computeConfigHash({
      userId: 1,
      name: 'Alpha Test',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      parameters: { fastEmaPeriod: 9, slowEmaPeriod: 21 },
      startBalance: 10000
    });

    expect(hash1).toBeTruthy();
    expect(hash1).toBe(hash2);

    const hashDifferent = experimentService.computeConfigHash({
      userId: 1,
      name: 'Alpha Test',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      parameters: { fastEmaPeriod: 10, slowEmaPeriod: 21 }, // changed parameter
      startBalance: 10000
    });

    expect(hash1).not.toBe(hashDifferent);
  });

  it('enforces lifecycle state transitions', async () => {
    const exp = await experimentService.createExperiment({
      userId: 1,
      name: 'Lifecycle Experiment',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m'
    });

    expect(exp.status).toBe('CREATED');

    // CREATED -> RUNNING is valid
    const running = await experimentService.updateStatus(exp.id, 'RUNNING');
    expect(running.status).toBe('RUNNING');

    // RUNNING -> PAUSED is valid
    const paused = await experimentService.updateStatus(exp.id, 'PAUSED');
    expect(paused.status).toBe('PAUSED');

    // PAUSED -> COMPLETED is valid
    const completed = await experimentService.updateStatus(exp.id, 'COMPLETED');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeTruthy();

    // COMPLETED -> RUNNING should fail
    await expect(experimentService.updateStatus(exp.id, 'RUNNING')).rejects.toThrow(
      /Cannot modify experiment in COMPLETED terminal status/
    );
  });

  it('records paper trade entries in the journal and updates win rate and balance', async () => {
    const exp = await experimentService.createExperiment({
      userId: 1,
      name: 'Trade Logging Test',
      strategy: 'EMA_RSI',
      asset: 'BTC/USD',
      timeframe: '5m',
      startBalance: 10000
    });

    await experimentService.updateStatus(exp.id, 'RUNNING');

    const trade1 = await experimentService.logTrade({
      experimentId: exp.id,
      direction: 'BUY',
      entryPrice: 50000,
      exitPrice: 51000,
      amount: 1000,
      slippage: 0.0001,
      fees: 1.0,
      journalNotes: 'Good momentum breakout confirmation'
    });

    expect(trade1.result).toBe('WIN');
    expect(trade1.pnl).toBeGreaterThan(0);

    const updatedExp = await experimentService.getExperiment(exp.id);
    expect(updatedExp?.totalTrades).toBe(1);
    expect(updatedExp?.winRate).toBe(100);
    expect(updatedExp?.currentBalance).toBeGreaterThan(10000);
  });
});
