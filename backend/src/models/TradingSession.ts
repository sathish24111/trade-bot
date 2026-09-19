export type SessionStatus = 'IDLE' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'COMPLETED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type StrategyName = 'EMA_RSI' | 'MACD' | 'BOLLINGER_BANDS' | 'MULTI_INDICATOR';

export interface TradingSession {
  id: string;
  user_id: number;
  investment_amount: number;
  strategy: StrategyName;
  risk_level: RiskLevel;
  duration: number; // in minutes
  starting_balance: number;
  ending_balance: number | null;
  current_pnl: number;
  status: SessionStatus;
  termination_reason: string | null;
  started_at: Date;
  ended_at: Date | null;
}
