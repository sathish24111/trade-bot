import { Request, Response } from 'express';
import { strategyControlService } from '../services/monitoring/strategyControl.service';
import { strategyEngine } from '../services/strategy.service';

export class StrategyControlController {
  async getStrategies(req: Request, res: Response) {
    try {
      const allStrategies = strategyEngine.getAllStrategies();
      const states = strategyControlService.getAllStrategyStates();

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
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateState(req: Request, res: Response) {
    try {
      const strategyId = req.params.id;
      const { state, reason, userId } = req.body;

      if (!state || !['enabled', 'disabled', 'paused'].includes(state)) {
        return res.status(400).json({
          success: false,
          error: "Invalid strategy state. Allowed values are 'enabled', 'disabled', or 'paused'."
        });
      }

      const updated = await strategyControlService.setStrategyState(
        strategyId,
        state,
        reason || 'User state modification',
        userId || 1
      );

      return res.json({
        success: true,
        strategy: updated,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAuditLog(req: Request, res: Response) {
    try {
      const strategyId = req.query.strategy as string | undefined;
      const logs = await strategyControlService.getAuditLog(strategyId);
      return res.json({
        success: true,
        auditLogs: logs,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getPolicy(req: Request, res: Response) {
    try {
      const { strategyPolicyService } = await import('../services/strategy/strategyPolicy.service');
      const policy = await strategyPolicyService.getPolicy(req.params.id);
      return res.json({
        success: true,
        policy,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updatePolicy(req: Request, res: Response) {
    try {
      const { strategyPolicyService } = await import('../services/strategy/strategyPolicy.service');
      const userId = (req as any).user?.id || 1;
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
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAdaptationHistory(req: Request, res: Response) {
    try {
      const { strategyPolicyService } = await import('../services/strategy/strategyPolicy.service');
      const history = await strategyPolicyService.getAdaptationHistory(req.params.id);
      return res.json({
        success: true,
        history,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async pauseStrategy(req: Request, res: Response) {
    try {
      const { strategyPolicyService } = await import('../services/strategy/strategyPolicy.service');
      const reason = req.body?.reason || 'User manual pause command';
      await strategyPolicyService.autoPauseStrategy(req.params.id, 'MANUAL_PAUSE', reason);
      return res.json({
        success: true,
        message: `Strategy ${req.params.id} paused successfully.`,
        mode: 'PAPER',
        isRealMoney: false,
        brokerConnected: false
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async resumeStrategy(req: Request, res: Response) {
    try {
      const { strategyPolicyService } = await import('../services/strategy/strategyPolicy.service');
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
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const strategyControlController = new StrategyControlController();
