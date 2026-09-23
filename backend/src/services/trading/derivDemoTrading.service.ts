import WebSocket from 'ws';

export interface DerivDemoAccountInfo {
  connected: boolean;
  loginId: string | null;
  accountId: string | null;
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
  balanceAfter: string;
  transactionId: number;
  longcode: string;
  mode: 'PAPER_DEMO';
}

export class DerivDemoTradingService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private appId: string | null = null;
  private accountId: string | null = null;

  private accountInfo: DerivDemoAccountInfo = {
    connected: false,
    loginId: null,
    accountId: null,
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
      this.connectDemo(process.env.DERIV_DEMO_TOKEN, process.env.DERIV_APP_ID).catch(err => {
        console.warn(`[DerivDemo] Auto-connect failed: ${err.message}`);
      });
    }
  }

  private getNextReqId(): number {
    return this.reqIdCounter++;
  }

  public async ensureConnected(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const token = this.token || process.env.DERIV_DEMO_TOKEN;
      const appId = this.appId || process.env.DERIV_APP_ID;
      if (token) {
        await this.connectDemo(token, appId);
      }
    }
  }

  private async sendRequest(req: any): Promise<any> {
    await this.ensureConnected();

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

  /**
   * Connects to Deriv Demo Account using PAT token and App ID (or classic token).
   * Strictly enforces that the account is a DEMO account (account_type === 'demo' or is_virtual === 1).
   */
  public async connectDemo(token: string, appId?: string): Promise<DerivDemoAccountInfo> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Valid Deriv Demo API Token is required.');
    }

    const cleanToken = token.trim();
    const cleanAppId = (appId || process.env.DERIV_APP_ID || '34sBpnEN9Uwa8TI8WmNIr').trim();

    this.token = cleanToken;
    this.appId = cleanAppId;
    this.disconnect();

    // 1. If it's a Personal Access Token (pat_...) or using the new API, query /trading/v1/options/accounts
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${cleanToken}`
      };
      if (cleanAppId) {
        headers['Deriv-App-ID'] = cleanAppId;
      }

      const accountsRes = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        headers
      });

      const accountsJson = await accountsRes.json();
      if (!accountsRes.ok || !accountsJson.data || accountsJson.data.length === 0) {
        throw new Error(accountsJson.message || accountsJson.error?.message || 'No accounts found for token');
      }

      // Find demo account
      const demoAcc = accountsJson.data.find((a: any) => a.account_type === 'demo');
      if (!demoAcc) {
        throw new Error('[SAFETY VIOLATION] No demo account found. TradePilot strictly allows Demo accounts only.');
      }

      // --- CRITICAL SAFETY ENFORCEMENT ---
      if (demoAcc.account_type !== 'demo') {
        throw new Error('[SAFETY VIOLATION] Connected account is not a demo account.');
      }

      this.accountId = demoAcc.account_id;

      // 2. Request OTP WebSocket URL for this demo account
      const otpRes = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${demoAcc.account_id}/otp`, {
        method: 'POST',
        headers
      });
      const otpJson = await otpRes.json();
      if (!otpJson.data || !otpJson.data.url) {
        throw new Error(otpJson.message || 'Failed to obtain Deriv Demo WebSocket OTP');
      }

      const wsUrl = otpJson.data.url;

      // 3. Connect to Authenticated Demo WebSocket
      return await new Promise((resolve, reject) => {
        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.on('open', () => {
            this.accountInfo = {
              connected: true,
              loginId: demoAcc.account_id,
              accountId: demoAcc.account_id,
              email: null,
              currency: demoAcc.currency || 'USD',
              balance: parseFloat(demoAcc.balance || '10000.00'),
              isVirtual: true,
              landingCompany: demoAcc.group || 'demo',
              scopes: ['read', 'trade'],
              safetyVerified: true
            };

            console.log(
              `[DerivDemo] Verified Demo Account: ${demoAcc.account_id} (${demoAcc.currency} ${demoAcc.balance}) [SAFETY VERIFIED: DEMO ONLY]`
            );

            resolve(this.accountInfo);
          });

          this.ws.on('message', (raw: WebSocket.RawData) => {
            try {
              const data = JSON.parse(raw.toString());
              if (data.req_id && this.pendingRequests.has(Number(data.req_id))) {
                const pending = this.pendingRequests.get(Number(data.req_id))!;
                this.pendingRequests.delete(Number(data.req_id));
                pending.resolve(data);
              }
            } catch {
              // ignore
            }
          });

          this.ws.on('error', (err) => {
            console.warn(`[DerivDemo] WebSocket error: ${err.message}`);
          });

          this.ws.on('close', () => {
            this.accountInfo.connected = false;
          });
        } catch (err) {
          this.disconnect();
          reject(err);
        }
      });
    } catch (err: any) {
      this.disconnect();
      throw err;
    }
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

    const derivSymbol = symbol.replace('/', '');
    const res = await this.sendRequest({
      proposal: 1,
      amount,
      basis: 'stake',
      contract_type: contractType,
      currency: this.accountInfo.currency,
      duration,
      duration_unit: durationUnit,
      underlying_symbol: derivSymbol
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
