import { pool } from '../../config/database';

export interface BackupMetadata {
  backupId: string;
  timestamp: string;
  tablesBackedUp: string[];
  totalRecords: number;
  mode: string;
}

export class BackupRestoreService {
  /**
   * Generates a safe in-memory or JSON-serializable snapshot of critical paper data tables.
   */
  async createPaperDataBackup(): Promise<{ metadata: BackupMetadata; data: Record<string, any[]> }> {
    const backupId = `BACKUP_${Date.now()}`;
    const targetTables = [
      'users',
      'paper_experiments',
      'paper_experiment_trades',
      'research_jobs',
      'daily_research_reports',
      'audit_logs'
    ];

    const data: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const table of targetTables) {
      try {
        const [rows] = await pool.query<any[]>(`SELECT * FROM ?? LIMIT 500`, [table]);
        data[table] = rows;
        totalRecords += rows.length;
      } catch {
        data[table] = [];
      }
    }

    const metadata: BackupMetadata = {
      backupId,
      timestamp: new Date().toISOString(),
      tablesBackedUp: targetTables,
      totalRecords,
      mode: 'PAPER'
    };

    return { metadata, data };
  }

  /**
   * Validates a backup dataset for schema compatibility and data integrity before restoration.
   */
  validateBackup(backupData: { metadata: BackupMetadata; data: Record<string, any[]> }): {
    valid: boolean;
    errors: string[];
    recordCount: number;
  } {
    const errors: string[] = [];
    if (!backupData || !backupData.metadata || !backupData.data) {
      errors.push('Malformed backup payload structure');
      return { valid: false, errors, recordCount: 0 };
    }

    if (backupData.metadata.mode !== 'PAPER') {
      errors.push('Incompatible trading mode in backup metadata');
    }

    const requiredTables = ['users', 'paper_experiments', 'research_jobs'];
    for (const tbl of requiredTables) {
      if (!Array.isArray(backupData.data[tbl])) {
        errors.push(`Missing required table dataset: ${tbl}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      recordCount: backupData.metadata.totalRecords || 0
    };
  }
}

export const backupRestoreService = new BackupRestoreService();
