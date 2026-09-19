import { pool } from '../../config/database';
import { ConfigDiffItem, ExperimentDiffResult, ExperimentLineageNode } from '../../models/Phase9';
import { experimentService } from './experiment.service';

export class ExperimentDiffService {
  /**
   * Compares two experiments and generates a detailed structural diff
   */
  async diffExperiments(experimentAId: string, experimentBId: string): Promise<ExperimentDiffResult> {
    const expA = await experimentService.getExperiment(experimentAId);
    const expB = await experimentService.getExperiment(experimentBId);

    const paramsA = expA?.parameters || {};
    const paramsB = expB?.parameters || {};

    const strategyDiff: ConfigDiffItem[] = [
      {
        field: 'strategy',
        valueA: expA?.strategy || 'EMA_RSI',
        valueB: expB?.strategy || 'EMA_RSI',
        isModified: (expA?.strategy || 'EMA_RSI') !== (expB?.strategy || 'EMA_RSI')
      },
      {
        field: 'asset',
        valueA: expA?.asset || 'BTC/USD',
        valueB: expB?.asset || 'BTC/USD',
        isModified: (expA?.asset || 'BTC/USD') !== (expB?.asset || 'BTC/USD')
      },
      {
        field: 'timeframe',
        valueA: expA?.timeframe || '5m',
        valueB: expB?.timeframe || '5m',
        isModified: (expA?.timeframe || '5m') !== (expB?.timeframe || '5m')
      }
    ];

    const allParamKeys = Array.from(new Set([...Object.keys(paramsA), ...Object.keys(paramsB)]));
    const parameterDiff: ConfigDiffItem[] = allParamKeys.map(key => ({
      field: key,
      valueA: paramsA[key] ?? null,
      valueB: paramsB[key] ?? null,
      isModified: paramsA[key] !== paramsB[key]
    }));

    const riskDiff: ConfigDiffItem[] = [
      {
        field: 'riskPerTrade',
        valueA: (expA as any)?.riskPerTrade ?? 1.0,
        valueB: (expB as any)?.riskPerTrade ?? 1.0,
        isModified: false
      },
      {
        field: 'maxDailyLossPct',
        valueA: 3.0,
        valueB: 3.0,
        isModified: false
      }
    ];

    const datasetDiff: ConfigDiffItem[] = [
      {
        field: 'datasetId',
        valueA: 'DS_DEFAULT',
        valueB: 'DS_DEFAULT',
        isModified: false
      }
    ];

    const result: ExperimentDiffResult = {
      experimentAId,
      experimentBId,
      strategyDiff,
      parameterDiff,
      riskDiff,
      datasetDiff,
      generatedAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO experiment_diffs (experiment_a_id, experiment_b_id, diff_payload)
         VALUES (?, ?, ?)`,
        [experimentAId, experimentBId, JSON.stringify(result)]
      );
    } catch {}

    return result;
  }

  /**
   * Tracks and records lineage for a cloned or derived experiment
   */
  async recordLineage(params: {
    experimentId: string;
    parentExperimentId?: string;
    changeDescription: string;
  }): Promise<ExperimentLineageNode> {
    const parentId = params.parentExperimentId;
    let rootId = params.experimentId;
    let depth = 0;

    if (parentId) {
      try {
        const [rows] = await pool.query<any[]>(
          'SELECT root_experiment_id, lineage_depth FROM experiment_lineage WHERE experiment_id = ?',
          [parentId]
        );
        if (rows.length > 0) {
          rootId = rows[0].root_experiment_id;
          depth = rows[0].lineage_depth + 1;
        } else {
          rootId = parentId;
          depth = 1;
        }
      } catch {
        rootId = parentId;
        depth = 1;
      }
    }

    const node: ExperimentLineageNode = {
      experimentId: params.experimentId,
      name: `Experiment ${params.experimentId}`,
      strategyId: 'EMA_RSI',
      parentExperimentId: parentId,
      rootExperimentId: rootId,
      lineageDepth: depth,
      changeDescription: params.changeDescription,
      createdAt: new Date().toISOString()
    };

    try {
      await pool.query(
        `INSERT INTO experiment_lineage (experiment_id, parent_experiment_id, root_experiment_id, lineage_depth, change_description)
         VALUES (?, ?, ?, ?, ?)`,
        [node.experimentId, parentId || null, rootId, depth, params.changeDescription]
      );
    } catch {}

    return node;
  }

  async getLineageTree(rootExperimentId: string): Promise<ExperimentLineageNode[]> {
    try {
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM experiment_lineage WHERE root_experiment_id = ? OR experiment_id = ? ORDER BY lineage_depth ASC',
        [rootExperimentId, rootExperimentId]
      );
      return rows.map(r => ({
        experimentId: r.experiment_id,
        name: `Experiment ${r.experiment_id}`,
        strategyId: 'EMA_RSI',
        parentExperimentId: r.parent_experiment_id,
        rootExperimentId: r.root_experiment_id,
        lineageDepth: r.lineage_depth,
        changeDescription: r.change_description,
        createdAt: new Date(r.created_at).toISOString()
      }));
    } catch {
      return [];
    }
  }
}

export const experimentDiffService = new ExperimentDiffService();
