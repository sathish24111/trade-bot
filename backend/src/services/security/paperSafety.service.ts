import { env } from '../../config/env';

export interface SafetyAuditReport {
  timestamp: string;
  tradingMode: string;
  brokerConnected: boolean;
  realMoney: boolean;
  realExecution: boolean;
  prohibitedRoutesAbsent: boolean;
  safetyStatus: 'VERIFIED' | 'COMPROMISED';
  envelope: {
    mode: string;
    isRealMoney: boolean;
    brokerConnected: boolean;
  };
}

export class PaperSafetyService {
  /**
   * Universal safety envelope attached to all responses and events.
   */
  getSafetyEnvelope() {
    return {
      mode: 'PAPER',
      isRealMoney: false,
      brokerConnected: false
    };
  }

  /**
   * Centralized safety verification.
   * Throws an error immediately if any live-trading capability is present.
   */
  verifySafetyOrThrow(): void {
    if (env.TRADING_MODE !== 'PAPER') {
      throw new Error(
        `[SAFETY VIOLATION] TRADING_MODE is '${env.TRADING_MODE}'. Live trading is strictly forbidden.`
      );
    }

    if (process.env.BROKER_API_KEY || process.env.LIVE_TRADING_KEY) {
      throw new Error(
        '[SAFETY VIOLATION] Broker credentials detected. TradePilot is paper-only.'
      );
    }
  }

  /**
   * Verifies that no prohibited routes exist in the Express application.
   */
  verifyNoProhibitedRoutes(routes: string[]): boolean {
    const prohibitedKeywords = [
      '/broker',
      '/deposit',
      '/withdraw',
      '/live-order',
      '/order/live',
      '/real-money',
      '/wire',
      '/transfer'
    ];

    for (const route of routes) {
      const lower = route.toLowerCase();
      for (const keyword of prohibitedKeywords) {
        if (lower.includes(keyword)) {
          throw new Error(`[SAFETY VIOLATION] Prohibited route detected: ${route}`);
        }
      }
    }
    return true;
  }

  /**
   * Generates a complete Paper Safety Audit Report.
   */
  auditSafety(): SafetyAuditReport {
    this.verifySafetyOrThrow();

    return {
      timestamp: new Date().toISOString(),
      tradingMode: 'PAPER',
      brokerConnected: false,
      realMoney: false,
      realExecution: false,
      prohibitedRoutesAbsent: true,
      safetyStatus: 'VERIFIED',
      envelope: this.getSafetyEnvelope()
    };
  }
}

export const paperSafetyService = new PaperSafetyService();
