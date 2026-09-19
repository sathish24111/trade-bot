import { datasetService } from '../src/services/research/dataset.service';
import { HistoricalCandle } from '../src/models/Research';

describe('Dataset Management & Quality Pipeline Tests', () => {
  const baseTime = 1700000000000; // Fixed timestamp for deterministic testing

  it('validates OHLC sanity and rejects bars where high < low or open/close out of bounds', () => {
    const rawCandles: HistoricalCandle[] = [
      {
        timestamp: baseTime,
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      },
      {
        timestamp: baseTime + 300000,
        open: 105,
        high: 90, // Invalid: high < low & high < open
        low: 95,
        close: 100,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      }
    ];

    const { cleanedCandles, report } = datasetService.validateCandles(rawCandles, '5m');
    expect(cleanedCandles.length).toBe(1);
    expect(report.invalidOhlcCandles).toBe(1);
    expect(report.passed).toBe(false);
  });

  it('deduplicates identical timestamps and sorts chronologically', () => {
    const rawCandles: HistoricalCandle[] = [
      {
        timestamp: baseTime + 600000,
        open: 105,
        high: 110,
        low: 100,
        close: 108,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      },
      {
        timestamp: baseTime,
        open: 100,
        high: 105,
        low: 98,
        close: 102,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      },
      {
        timestamp: baseTime, // Duplicate
        open: 100,
        high: 105,
        low: 98,
        close: 102,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      }
    ];

    const { cleanedCandles, report } = datasetService.validateCandles(rawCandles, '5m');
    expect(cleanedCandles.length).toBe(2);
    expect(report.duplicateTimestamps).toBe(1);
    expect(report.outOfOrderCandles).toBe(1);
    expect(cleanedCandles[0].timestamp).toBe(baseTime);
    expect(cleanedCandles[1].timestamp).toBe(baseTime + 600000);
  });

  it('detects timeframe gaps without fabricating or synthesizing fake bars', () => {
    const rawCandles: HistoricalCandle[] = [
      {
        timestamp: baseTime,
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      },
      {
        // 5m is 300,000ms. A 15m gap is 900,000ms
        timestamp: baseTime + 900000,
        open: 102,
        high: 108,
        low: 101,
        close: 107,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      }
    ];

    const { cleanedCandles, report } = datasetService.validateCandles(rawCandles, '5m');
    expect(report.gapCount).toBe(1);
    expect(report.maxGapDurationSec).toBe(900);
    expect(report.warnings.some((w) => w.includes('DATA_GAP_DETECTED'))).toBe(true);
    // Never fabricate candles across gap
    expect(cleanedCandles.length).toBe(2);
  });

  it('generates deterministic SHA-256 checksums', () => {
    const makeCandles = () => [
      {
        timestamp: baseTime,
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 50,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      },
      {
        timestamp: baseTime + 300000,
        open: 102,
        high: 108,
        low: 101,
        close: 107,
        volume: 60,
        timeframe: '5m',
        source: 'test',
        isComplete: true
      }
    ];

    const res1 = datasetService.validateCandles(makeCandles(), '5m');
    const res2 = datasetService.validateCandles(makeCandles(), '5m');

    expect(res1.report.sha256Checksum).toBeTruthy();
    expect(res1.report.sha256Checksum).toBe(res2.report.sha256Checksum);
  });

  it('partitions dataset strictly into train, val, and test slices', () => {
    const candles: HistoricalCandle[] = [];
    for (let i = 0; i < 100; i++) {
      candles.push({
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

    const { train, val, test } = datasetService.partitionDataset(candles, 0.70, 0.15, 0.15);
    expect(train.length).toBe(70);
    expect(val.length).toBe(15);
    expect(test.length).toBe(15);
    // Strict chronological separation
    expect(train[train.length - 1].timestamp).toBeLessThan(val[0].timestamp);
    expect(val[val.length - 1].timestamp).toBeLessThan(test[0].timestamp);
  });
});
