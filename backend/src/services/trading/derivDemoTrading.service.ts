import WebSocket from 'ws';
import { paperSafetyService } from '../security/paperSafety.service';

export interface DerivDemoAccountInfo {
  connected: boolean;
  loginId: string | null;
  email: string | null;
  currency: string;
  balance: number;
  isVirtual: boolean;
  landingCompany: string | null;
  scopes: string[];
  safetyVerified: boolean;
}

export interface DerivDemoProposal {
  proposalId: string;
  payout: number;
  askPrice: number;
  spot: number;
  spotTime: number;
  longcode: string;
}

export interface DerivDemoContractResult {
  contractId: number;
  buyPrice: number;
  balanceAfter: number;
  transactionId: number;
  longcode: string;
  mode: 'PAPER_DEMO';
}

export class DerivDemoTradingService {
  private ws: WebSocket | null = null;
  private token: string | null = null;

  private accountInfo: DerivDemoAccountInfo = {
    connected: false,
    loginId: null,
    email: null,
    currency: 'USD',
    balance: 0,
    isVirtual: true,
    landingCompany: null,
    scopes: [],
    safetyVerified: false
  };

  private pendingRequests: Map<number, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private reqIdCounter = 1;

  constructor() {
    if (process.env.DERIV_DEMO_TOKEN) {
      this.connectDemo(process.env.DERIV_DEMO_TOKEN).catch(err => {
        console.warn(`[DerivDemo] Auto-connect failed: ${err.message}`);
      });
    }
  }

  private getNextReqId(): number {
    return this.reqIdCounter++;
  }

  private sendRequest(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('Deriv WebSocket is not connected'));
      }

      const reqId = this.getNextReqId();
      req.req_id = reqId;

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(reqId)) {
          this.pendingRequests.delete(reqId);
          reject(new Error(`Deriv request timed out (${req.msg_type || 'unknown'})`));
        }
      }, 12000);

      this.pendingRequests.set(reqId, {
        resolve: (data) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });

      this.ws.send(JSON.stringify(req));
    });
  }

  public async connectDemo(token: string): Promise<DerivDemoAccountInfo> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Valid Deriv Demo API Token is required.');
    }

    const cleanToken = token.trim();
    this.token = cleanToken;
    this.disconnect();

    return new Promise((resolve, reject) => {
      try {
        const url = 'wss://api.derivws.com/trading/v1/options/ws/public';
        this.ws = new WebSocket(url);

        this.ws.on('open', async () => {
          try {
            console.log('[DerivDemo] Connected to Deriv WS. Sending authorization check...');
            const authRes = await this.sendRequest({ authorize: cleanToken });

            if (authRes.error) {
              this.disconnect();
              return reject(new Error(`Deriv Authorization Error: ${authRes.error.message || 'Invalid token'}`));
            }

            const auth = authRes.authorize;

            // --- CRITICAL PAPER-ONLY SAFETY GUARD ---
            if (auth.is_virtual !== 1 || !auth.loginid?.startsWith('VRTC')) {
              this.disconnect();
              return reject(
                new Error(
                  '[SAFETY VIOLATION] TradePilot connects to Deriv VIRTUAL / DEMO accounts ONLY. Real accounts (CR...) are strictly forbidden.'
                )
              );
            }

            this.accountInfo = {
              connected: true,
              loginId: auth.loginid,
              email: auth.email,
              currency: auth.currency,
              balance: parseFloat(auth.balance),
              isVirtual: true,
              landingCompany: auth.landing_company_name,
              scopes: auth.scopes || [],
              safetyVerified: true
            };

            console.log(
              `[DerivDemo] Verified Demo Account: ${auth.loginid} (${auth.currency} ${auth.balance}) [SAFETY VERIFIED: DEMO ONLY]`
            );

            // Subscribe to real-time virtual balance changes
            this.sendRequest({ balance: 1, subscribe: 1 }).catch(() => {});

            resolve(this.accountInfo);
          } catch (err: any) {
            this.disconnect();
            reject(err);
          }
        });

        this.ws.on('message', (raw: WebSocket.RawData) => {
          try {
            const data = JSON.parse(raw.toString());

            // Check pending requests
            if (data.req_id && this.pendingRequests.has(Number(data.req_id))) {
              const pending = this.pendingRequests.get(Number(data.req_id))!;
              this.pendingRequests.delete(Number(data.req_id));
              pending.resolve(data);
            }

            // Real-time balance subscription update
            if (data.msg_type === 'balance' && data.balance) {
              this.accountInfo.balance = parseFloat(data.balance.balance);
            }
          } catch {
            // ignore JSON parse errors
          }
        });

        this.ws.on('error', (err) => {
          console.warn(`[DerivDemo] WebSocket error: ${err.message}`);
        });

        this.ws.on('close', () => {
          this.accountInfo.connected = false;
        });
      } catch (err: any) {
        this.disconnect();
        reject(err);
      }
    });
  }

  public getAccountInfo(): DerivDemoAccountInfo {
    return { ...this.accountInfo };
  }

  public async getProposal(
    symbol: string,
    amount: number,
    contractType: 'CALL' | 'PUT',
    duration: number = 5,
    durationUnit: 't' | 'm' | 's' = 't'
  ): Promise<DerivDemoProposal> {
    if (!this.accountInfo.connected) {
      throw new Error('Deriv Demo account is not connected. Please connect with your Demo API Token first.');
    }

    const res = await this.sendRequest({
      proposal: 1,
      amount,
      basis: 'stake',
      contract_type: contractType,
      currency: this.accountInfo.currency,
      duration,
      duration_unit: durationUnit,
      symbol
    });

    if (res.error) {
      throw new Error(`Deriv Proposal Error: ${res.error.message}`);
    }

    const p = res.proposal;
    return {
      proposalId: p.id,
      payout: p.payout,
      askPrice: p.ask_price,
      spot: p.spot,
      spotTime: p.spot_time,
      longcode: p.longcode
    };
  }

  public async executeDemoTrade(proposalId: string, price: number): Promise<DerivDemoContractResult> {
    if (!this.accountInfo.connected || !this.accountInfo.safetyVerified) {
      throw new Error('Deriv Demo account is not connected and safety verified.');
    }

    // Safety check: verify virtual balance is sufficient
    if (price > this.accountInfo.balance) {
      throw new Error(`Virtual stake (${price}) exceeds Deriv virtual balance (${this.accountInfo.balance})`);
    }

    const res = await this.sendRequest({
      buy: proposalId,
      price
    });

    if (res.error) {
      throw new Error(`Deriv Demo Trade Error: ${res.error.message}`);
    }

    const buy = res.buy;
    this.accountInfo.balance = parseFloat(buy.balance_after);

    return {
      contractId: buy.contract_id,
      buyPrice: buy.buy_price,
      balanceAfter: buy.balance_after,
      transactionId: buy.transaction_id,
      longcode: buy.longcode,
      mode: 'PAPER_DEMO'
    };
  }

  public disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.accountInfo.connected = false;
    this.accountInfo.safetyVerified = false;
  }
}

export const derivDemoTradingService = new DerivDemoTradingService();
