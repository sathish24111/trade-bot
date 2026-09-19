import { Candle, TechnicalIndicators, MacdResult, BollingerResult } from '../models/MarketData';

export class IndicatorService {

  calculateSMA(values: number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(0);
    if (values.length < period || period <= 0) return result;

    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    result[period - 1] = sum / period;

    for (let i = period; i < values.length; i++) {
      sum += values[i] - values[i - period];
      result[i] = sum / period;
    }
    return result;
  }

  calculateEMA(values: number[], period: number): number[] {
    const result: number[] = new Array(values.length).fill(0);
    if (values.length < period || period <= 0) return result;

    const k = 2 / (period + 1);

    // Seed with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    let prevEma = sum / period;
    result[period - 1] = prevEma;

    for (let i = period; i < values.length; i++) {
      const currentEma = (values[i] - prevEma) * k + prevEma;
      result[i] = currentEma;
      prevEma = currentEma;
    }
    return result;
  }

  calculateRSI(closes: number[], period = 14): number[] {
    const result: number[] = new Array(closes.length).fill(50);
    if (closes.length <= period || period <= 0) return result;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) {
      result[period] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[period] = 100 - (100 / (1 + rs));
    }

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) {
        result[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        result[i] = 100 - (100 / (1 + rs));
      }
    }
    return result;
  }

  calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9): {
    macdLine: number[];
    signalLine: number[];
    histogram: number[];
  } {
    const fastEMA = this.calculateEMA(closes, fast);
    const slowEMA = this.calculateEMA(closes, slow);

    const macdLine: number[] = new Array(closes.length).fill(0);
    for (let i = slow - 1; i < closes.length; i++) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }

    // Calculate signal line as EMA of macdLine from index slow-1
    const validMacd = macdLine.slice(slow - 1);
    const signalLineFromValid = this.calculateEMA(validMacd, signal);

    const signalLine: number[] = new Array(closes.length).fill(0);
    const histogram: number[] = new Array(closes.length).fill(0);

    for (let i = 0; i < validMacd.length; i++) {
      const fullIdx = (slow - 1) + i;
      signalLine[fullIdx] = signalLineFromValid[i];
      histogram[fullIdx] = macdLine[fullIdx] - signalLine[fullIdx];
    }

    return { macdLine, signalLine, histogram };
  }

  calculateBollingerBands(closes: number[], period = 20, stdDevMultiplier = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
  } {
    const middle = this.calculateSMA(closes, period);
    const upper: number[] = new Array(closes.length).fill(0);
    const lower: number[] = new Array(closes.length).fill(0);

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      upper[i] = mean + (stdDevMultiplier * stdDev);
      lower[i] = mean - (stdDevMultiplier * stdDev);
    }

    return { upper, middle, lower };
  }

  calculateATR(candles: Candle[], period = 14): number[] {
    const result: number[] = new Array(candles.length).fill(0);
    if (candles.length < period || period <= 0) return result;

    const trs: number[] = [candles[0].high - candles[0].low];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const prevClose = candles[i - 1].close;
      const tr = Math.max(
        c.high - c.low,
        Math.abs(c.high - prevClose),
        Math.abs(c.low - prevClose)
      );
      trs.push(tr);
    }

    // First ATR is simple average of TRs
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += trs[i];
    }
    let prevAtr = sum / period;
    result[period - 1] = prevAtr;

    for (let i = period; i < candles.length; i++) {
      const currentAtr = (prevAtr * (period - 1) + trs[i]) / period;
      result[i] = currentAtr;
      prevAtr = currentAtr;
    }

    return result;
  }

  calculateAllIndicators(candles: Candle[]): TechnicalIndicators {
    if (candles.length === 0) {
      return {
        ema21: 0,
        sma20: 0,
        sma50: 0,
        rsi14: 50,
        macd: { value: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        atr14: 0
      };
    }

    const closes = candles.map((c) => c.close);
    const lastIdx = closes.length - 1;

    const ema21Arr = this.calculateEMA(closes, 21);
    const sma20Arr = this.calculateSMA(closes, 20);
    const sma50Arr = this.calculateSMA(closes, Math.min(50, Math.max(10, closes.length)));
    const rsi14Arr = this.calculateRSI(closes, 14);
    const macdObj = this.calculateMACD(closes, 12, 26, 9);
    const bbObj = this.calculateBollingerBands(closes, 20, 2);
    const atrArr = this.calculateATR(candles, 14);

    return {
      ema21: Math.round(ema21Arr[lastIdx] * 100000) / 100000,
      sma20: Math.round(sma20Arr[lastIdx] * 100000) / 100000,
      sma50: Math.round(sma50Arr[lastIdx] * 100000) / 100000,
      rsi14: Math.round(rsi14Arr[lastIdx] * 10) / 10,
      macd: {
        value: Math.round(macdObj.macdLine[lastIdx] * 100000) / 100000,
        signal: Math.round(macdObj.signalLine[lastIdx] * 100000) / 100000,
        histogram: Math.round(macdObj.histogram[lastIdx] * 100000) / 100000
      },
      bollinger: {
        upper: Math.round(bbObj.upper[lastIdx] * 100000) / 100000,
        middle: Math.round(bbObj.middle[lastIdx] * 100000) / 100000,
        lower: Math.round(bbObj.lower[lastIdx] * 100000) / 100000
      },
      atr14: Math.round(atrArr[lastIdx] * 100000) / 100000
    };
  }
}

export const indicatorService = new IndicatorService();
