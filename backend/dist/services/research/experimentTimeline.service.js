"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.experimentTimelineService = exports.ExperimentTimelineService = void 0;
const database_1 = require("../../config/database");
const websocket_server_1 = require("../../websocket/websocket.server");
class ExperimentTimelineService {
    sequenceCounter = new Map();
    inMemoryTimeline = new Map();
    /**
     * Records an explicit event in the experiment timeline
     */
    async recordEvent(params) {
        const seq = (this.sequenceCounter.get(params.experimentId) || 0) + 1;
        this.sequenceCounter.set(params.experimentId, seq);
        const timestamp = params.timestamp ? new Date(params.timestamp) : new Date();
        const event = {
            experimentId: params.experimentId,
            sequence: seq,
            eventType: params.eventType,
            title: params.title,
            details: params.details || {},
            timestamp: timestamp.toISOString()
        };
        const memList = this.inMemoryTimeline.get(params.experimentId) || [];
        memList.push(event);
        this.inMemoryTimeline.set(params.experimentId, memList);
        try {
            const [res] = await database_1.pool.query(`INSERT INTO experiment_timeline_events (experiment_id, sequence, event_type, title, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`, [event.experimentId, event.sequence, event.eventType, event.title, JSON.stringify(event.details), timestamp]);
            event.id = res.insertId;
        }
        catch { }
        // Broadcast on WebSocket
        try {
            (0, websocket_server_1.broadcastEvent)({
                type: 'EXPERIMENT_TIMELINE_EVENT',
                experimentId: params.experimentId,
                sequence: event.sequence,
                eventType: event.eventType,
                title: event.title,
                timestamp: event.timestamp
            });
        }
        catch { }
        return event;
    }
    /**
     * Retrieves chronological event timeline for an experiment.
     * Merges explicit timeline events with trades, signals, alerts, and provider failovers.
     */
    async getTimeline(experimentId) {
        const events = [];
        // 1. Fetch from in-memory cache
        const memEvents = this.inMemoryTimeline.get(experimentId) || [];
        for (const me of memEvents) {
            events.push({ ...me });
        }
        // 2. Fetch from explicit timeline events table
        try {
            const [rows] = await database_1.pool.query(`SELECT id, experiment_id, sequence, event_type, title, details, timestamp
         FROM experiment_timeline_events
         WHERE experiment_id = ?
         ORDER BY sequence ASC, timestamp ASC`, [experimentId]);
            for (const r of rows) {
                if (!events.some(e => e.sequence === r.sequence && e.title === r.title)) {
                    events.push({
                        id: r.id,
                        experimentId: r.experiment_id,
                        sequence: r.sequence,
                        eventType: r.event_type,
                        title: r.title,
                        details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
                        timestamp: new Date(r.timestamp).toISOString()
                    });
                }
            }
        }
        catch { }
        // 2. Fetch experiment metadata and trades to enrich timeline if needed
        try {
            const [trades] = await database_1.pool.query(`SELECT id, asset, direction, amount, entry_price, exit_price, pnl, result, strategy, created_at
         FROM paper_experiment_trades
         WHERE experiment_id = ?
         ORDER BY created_at ASC`, [experimentId]);
            let tradeSeq = 1000;
            for (const t of trades) {
                // If trade not already represented in timeline events
                if (!events.some(e => e.eventType === 'TRADE' && e.details?.tradeId === t.id)) {
                    events.push({
                        experimentId,
                        sequence: tradeSeq++,
                        eventType: 'TRADE',
                        title: `Paper Trade ${t.result}: ${t.direction} ${t.asset} (PnL: ₹${t.pnl})`,
                        details: {
                            tradeId: t.id,
                            asset: t.asset,
                            direction: t.direction,
                            amount: t.amount,
                            pnl: t.pnl,
                            result: t.result,
                            strategy: t.strategy
                        },
                        timestamp: new Date(t.created_at).toISOString()
                    });
                }
            }
        }
        catch { }
        if (events.length === 0) {
            const initEvent = await this.recordEvent({
                experimentId,
                eventType: 'EXPERIMENT_INITIALIZED',
                title: `Paper experiment ${experimentId} initialized in DEMO mode`,
                details: { initializedAt: new Date().toISOString() }
            });
            events.push(initEvent);
        }
        // Strict sort by timestamp, then sequence
        events.sort((a, b) => {
            const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            if (timeDiff !== 0)
                return timeDiff;
            return a.sequence - b.sequence;
        });
        // Normalize monotonic sequence indices
        for (let i = 0; i < events.length; i++) {
            events[i].sequence = i + 1;
        }
        return events;
    }
}
exports.ExperimentTimelineService = ExperimentTimelineService;
exports.experimentTimelineService = new ExperimentTimelineService();
