import { SAFETY_METADATA_PHASE9 } from '../src/models/Phase9';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 9 Paper Trading Safety Suite', () => {
  test('Phase 9 safety metadata strictly enforces PAPER mode, isRealMoney=false, brokerConnected=false', () => {
    expect(SAFETY_METADATA_PHASE9.mode).toBe('PAPER');
    expect(SAFETY_METADATA_PHASE9.isRealMoney).toBe(false);
    expect(SAFETY_METADATA_PHASE9.brokerConnected).toBe(false);
  });

  test('No broker order execution, deposit, or live trading endpoints exist in routes', () => {
    const routesDir = path.resolve(__dirname, '../src/routes');
    const files = fs.readdirSync(routesDir);

    for (const file of files) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      expect(content).not.toMatch(/\/api\/broker\/order/i);
      expect(content).not.toMatch(/\/api\/real-money/i);
      expect(content).not.toMatch(/\/api\/live-execution/i);
      expect(content).not.toMatch(/\/api\/withdrawal/i);
      expect(content).not.toMatch(/\/api\/deposit/i);
    }
  });

  test('Phase 9 services emit paper safety metadata in websocket payloads', () => {
    const watchdogFile = fs.readFileSync(
      path.resolve(__dirname, '../src/services/research/paperExperimentWatchdog.service.ts'),
      'utf8'
    );
    expect(watchdogFile).toContain('SAFETY_METADATA_PHASE9');

    const whatIfFile = fs.readFileSync(
      path.resolve(__dirname, '../src/services/research/portfolioWhatIf.service.ts'),
      'utf8'
    );
    expect(whatIfFile).toContain('SAFETY_METADATA_PHASE9');
  });

  test('Research recommendations contain non-directive research phrasing only', () => {
    const recFile = fs.readFileSync(
      path.resolve(__dirname, '../src/services/research/researchRecommendation.service.ts'),
      'utf8'
    );
    expect(recFile).not.toContain('guaranteed profit');
    expect(recFile).not.toContain('buy now');
    expect(recFile).not.toContain('sell immediately');
  });
});
