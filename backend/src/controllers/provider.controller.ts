import { Request, Response } from 'express';
import { providerFailoverService } from '../services/market/providerFailover.service';
import { pool } from '../config/database';

export class ProviderController {
  async listProviders(req: Request, res: Response) {
    try {
      const activeName = providerFailoverService.getActiveProviderName();
      const currentTier = providerFailoverService.getCurrentTier();
      const health = providerFailoverService.getHealthInfo();

      const providers = [
        {
          id: 'CRYPTO_WS',
          name: 'Public Crypto WebSocket',
          type: 'WEBSOCKET_STREAM',
          role: 'PRIMARY',
          status: currentTier === 'PRIMARY_WS' ? health.connectionStatus : 'STANDBY',
          supportedAssets: ['BTC/USD', 'ETH/USD'],
          isLive: true,
          readOnly: true
        },
        {
          id: 'CRYPTO_REST',
          name: 'Public Crypto REST Fallback',
          type: 'REST_POLL',
          role: 'FALLBACK',
          status: currentTier === 'FALLBACK_REST' ? health.connectionStatus : 'AVAILABLE',
          supportedAssets: ['BTC/USD', 'ETH/USD'],
          isLive: true,
          readOnly: true
        },
        {
          id: 'SIMULATED',
          name: 'Simulated Market Data Engine',
          type: 'LOCAL_SIMULATOR',
          role: 'FAILSAFE',
          status: currentTier === 'SIMULATED' ? 'ACTIVE' : 'READY',
          supportedAssets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD'],
          isLive: false,
          readOnly: true
        }
      ];

      return res.json({
        success: true,
        activeProvider: activeName,
        currentTier,
        providers,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getHealth(req: Request, res: Response) {
    try {
      const health = providerFailoverService.getHealthInfo();
      return res.json({
        success: true,
        health,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getEvents(req: Request, res: Response) {
    try {
      const [rows] = await pool.query<any[]>(
        `SELECT id, provider, previous_state, new_state, reason, latency_ms, created_at
         FROM market_provider_events
         ORDER BY id DESC LIMIT 50`
      );

      return res.json({
        success: true,
        events: rows.map(r => ({
          id: r.id,
          provider: r.provider,
          previousState: r.previous_state,
          newState: r.new_state,
          reason: r.reason,
          latencyMs: r.latency_ms,
          createdAt: new Date(r.created_at).toISOString()
        })),
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const providerController = new ProviderController();
