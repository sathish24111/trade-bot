export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  password_hash?: string;
  demo_balance: number;
  account_type: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  demoBalance: number;
  accountType: string;
  isDemoMode: boolean;
}
