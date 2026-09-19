import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { pool } from '../config/database';
import { marketService } from '../services/market.service';
import { env } from '../config/env';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();
let marketTickerInterval: NodeJS.Timeout | null = null;

let currentSequence = 0;
const EVENT_BUFFER_MAX = 100;
const eventBuffer: any[] = [];

export function getEventBuffer(): any[] {
  return [...eventBuffer];
}

export function getLastSequence(): number {
  return currentSequence;
}

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    if (clients.size >= env.WEBSOCKET_MAX_CONNECTIONS) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: 'CONNECTION_LIMIT_EXCEEDED',
        message: 'Maximum concurrent WebSocket connections reached'
      }));
      ws.close(1008, 'Connection limit reached');
      return;
    }

    clients.add(ws);

    // Send initial welcome & mode confirmation with sequence
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      sequence: currentSequence,
      message: 'Connected to TradePilot Live Simulated Stream',
      mode: 'PAPER',
      isRealMoney: false,
      brokerConnected: false,
      disclaimer: 'Trading involves risk. Demo performance does not guarantee future results.'
    }));

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'PING') {
          ws.send(JSON.stringify({
            type: 'PONG',
            sequence: currentSequence,
            timestamp: Date.now()
          }));
        } else if (data.type === 'CATCH_UP' && typeof data.lastSequence === 'number') {
          // Send missed events since lastSequence
          const missed = eventBuffer.filter(e => e.sequence > data.lastSequence);
          for (const ev of missed) {
            ws.send(JSON.stringify(ev));
          }
        }
      } catch {
        // Ignore invalid message formats
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (clients.size === 0 && marketTickerInterval) {
        clearInterval(marketTickerInterval);
        marketTickerInterval = null;
      }
    });
  });

  // Background broadcast for SIMULATED MARKET DATA every 2 seconds
  if (!marketTickerInterval) {
    marketTickerInterval = setInterval(async () => {
      if (clients.size > 0) {
        const assets = marketService.tick();
        for (const a of assets) {
          broadcastEvent({
            type: 'MARKET_UPDATE',
            asset: a.symbol,
            price: a.price,
            changePercent: a.changePercent,
            demoSignal: a.demoSignal,
            confidence: a.confidence,
            reason: a.reason,
            indicators: a.indicators,
            dataSource: a.dataSource,
            status: a.status,
            isLive: a.isLive
          });
        }
      }
    }, 2000);
  }

  return wss;
}

export function broadcastEvent(eventData: any): any {
  currentSequence++;
  const envelope = {
    ...eventData,
    sequence: currentSequence,
    mode: 'PAPER',
    isRealMoney: false,
    brokerConnected: false,
    timestamp: eventData.timestamp || new Date().toISOString()
  };

  // Keep in bounded ring buffer for client reconnection recovery
  eventBuffer.push(envelope);
  if (eventBuffer.length > EVENT_BUFFER_MAX) {
    eventBuffer.shift();
  }

  const payload = JSON.stringify(envelope);

  let activeCount = 0;
  const isCritical = ['RISK_BREACH', 'KILL_SWITCH', 'ALERT', 'SYSTEM_STATE'].includes(envelope.type);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      if (client.bufferedAmount > 65536 && !isCritical) {
        // Drop non-critical event due to slow client backpressure
        continue;
      }
      client.send(payload);
      activeCount++;
    }
  }

  // Asynchronously log event into MySQL websocket_event_log
  pool.query(
    `INSERT INTO websocket_event_log (event_type, sequence, payload, recipient_count) VALUES (?, ?, ?, ?)`,
    [envelope.type || envelope.event || 'UNKNOWN', currentSequence, payload, activeCount]
  ).catch(() => {
    // In-memory buffering handles DB disconnects gracefully
  });

  return envelope;
}
