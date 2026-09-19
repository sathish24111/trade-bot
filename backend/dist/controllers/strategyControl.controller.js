"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategyControlController = exports.StrategyControlController = void 0;
const strategyControl_service_1 = require("../services/monitoring/strategyControl.service");
const strategy_service_1 = require("../services/strategy.service");
class StrategyControlController {
    async getStrategies(req, res) {
        try {
            const allStrategies = strategy_service_1.strategyEngine.getAllStrategies();
            const states = strategyControl_service_1.strategyControlService.getAllStrategyStates();
            const combined = allStrategies.map(s => {
                const stateObj = states.find(st => st.strategy === s.id);
                return {
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    defaultParameters: s.defaultParameters,
                    parameterDefinitions: s.parameterDefinitions,
                    state: stateObj ? stateObj.state : 'enabled',
                    updatedAt: stateObj ? stateObj.updatedAt : new Date().toISOString()
                };
            });
            return res.json({
                success: true,
                strategies: combined,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async updateState(req, res) {
        try {
            const strategyId = req.params.id;
            const { state, reason, userId } = req.body;
            if (!state || !['enabled', 'disabled', 'paused'].includes(state)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid strategy state. Allowed values are 'enabled', 'disabled', or 'paused'."
                });
            }
            const updated = await strategyControl_service_1.strategyControlService.setStrategyState(strategyId, state, reason || 'User state modification', userId || 1);
            return res.json({
                success: true,
                strategy: updated,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getAuditLog(req, res) {
        try {
            const strategyId = req.query.strategy;
            const logs = await strategyControl_service_1.strategyControlService.getAuditLog(strategyId);
            return res.json({
                success: true,
                auditLogs: logs,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getPolicy(req, res) {
        try {
            const { strategyPolicyService } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyPolicy.service')));
            const policy = await strategyPolicyService.getPolicy(req.params.id);
            return res.json({
                success: true,
                policy,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async updatePolicy(req, res) {
        try {
            const { strategyPolicyService } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyPolicy.service')));
            const userId = req.user?.id || 1;
            const policy = await strategyPolicyService.savePolicy({
                ...req.body,
                strategyId: req.params.id
            }, userId);
            return res.json({
                success: true,
                policy,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getAdaptationHistory(req, res) {
        try {
            const { strategyPolicyService } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyPolicy.service')));
            const history = await strategyPolicyService.getAdaptationHistory(req.params.id);
            return res.json({
                success: true,
                history,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async pauseStrategy(req, res) {
        try {
            const { strategyPolicyService } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyPolicy.service')));
            const reason = req.body?.reason || 'User manual pause command';
            await strategyPolicyService.autoPauseStrategy(req.params.id, 'MANUAL_PAUSE', reason);
            return res.json({
                success: true,
                message: `Strategy ${req.params.id} paused successfully.`,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async resumeStrategy(req, res) {
        try {
            const { strategyPolicyService } = await Promise.resolve().then(() => __importStar(require('../services/strategy/strategyPolicy.service')));
            const result = await strategyPolicyService.attemptRecovery(req.params.id, {
                manualApproval: true,
                bypassObservation: req.body?.force === true
            });
            return res.json({
                success: result.recovered,
                message: result.reason,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.StrategyControlController = StrategyControlController;
exports.strategyControlController = new StrategyControlController();
