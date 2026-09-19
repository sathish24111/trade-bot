export type TradeDirection = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS';

export interface Trade {
  id: string;
  session_id: string;
  user_id: number;
  asset: string;
  direction: TradeDirection;
  amount: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  result: TradeResult;
  strategy: string;
  created_at: Date;
}
