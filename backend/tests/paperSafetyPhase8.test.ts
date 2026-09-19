import { SAFETY_METADATA } from '../src/models/Phase8';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 8 Paper Trading Safety Suite', () => {
  test('Safety metadata strictly enforces PAPER mode, isRealMoney=false, brokerConnected=false', () => {
    expect(SAFETY_METADATA.mode).toBe('PAPER');
    expect(SAFETY_METADATA.isRealMoney).toBe(false);
    expect(SAFETY_METADATA.brokerConnected).toBe(false);
  });

  test('No broker execution or live trading API endpoints exist in routes', () => {
    const routesDir = path.resolve(__dirname, '../src/routes');
    const files = fs.readdirSync(routesDir);

    for (const file of files) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      expect(content).not.toMatch(/\/api\/broker\/order/i);
      expect(content).not.toMatch(/\/api\/real-money/i);
      expect(content).not.toMatch(/\/api\/withdraw/i);
      expect(content).not.toMatch(/\/api\/deposit/i);
    }
  });

  test('Controllers enforce safety headers and disclaimers', () => {
    const researchControllerContent = fs.readFileSync(
      path.resolve(__dirname, '../src/controllers/research.controller.ts'),
      'utf8'
    );
    expect(researchControllerContent).toContain('SAFETY_METADATA');
  });
});
