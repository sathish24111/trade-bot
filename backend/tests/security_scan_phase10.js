const fs = require('fs');
const path = require('path');

function runSecurityScan() {
  console.log('======================================================================');
  console.log('TRADEPILOT PHASE 10 — AUTOMATED SECURITY & CREDENTIAL SCANNER');
  console.log('======================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const filesScanned = [];
  const findings = [];

  // Patterns that might indicate leaked private credentials or real money broker APIs
  const sensitivePatterns = [
    { pattern: /-----BEGIN (RSA|EC|OPENSSH|DSA)? ?PRIVATE KEY-----/, desc: 'Private Key block detected' },
    { pattern: /AKIA[0-9A-Z]{16}/, desc: 'AWS Access Key detected' },
    { pattern: /binance_api_secret\s*=\s*['"][a-zA-Z0-9]{32,}['"]/, desc: 'Live Binance secret detected' },
    { pattern: /coinbase_secret\s*=\s*['"][a-zA-Z0-9]{32,}['"]/, desc: 'Live Coinbase secret detected' },
    { pattern: /interactive_brokers_password/, desc: 'Live Broker password reference detected' }
  ];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.gradle' ||
        entry.name === 'security_scan_phase10.js'
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.env.example'))) {
        filesScanned.push(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        for (const sp of sensitivePatterns) {
          if (sp.pattern.test(content)) {
            findings.push({
              file: fullPath,
              description: sp.desc
            });
          }
        }
      }
    }
  }

  scanDirectory(path.join(rootDir, 'src'));
  scanDirectory(path.join(rootDir, 'tests'));

  console.log(`Scanned ${filesScanned.length} source code and test files.`);

  if (findings.length > 0) {
    console.error(`\n[CRITICAL] Found ${findings.length} security vulnerability findings:`);
    findings.forEach(f => console.error(`  - ${f.file}: ${f.description}`));
    process.exit(1);
  } else {
    console.log('\n[PASS] Zero hardcoded private keys, zero AWS secrets, zero live broker secrets detected.');
    console.log('[PASS] Security scan passed cleanly.\n');
    console.log('======================================================================');
    process.exit(0);
  }
}

runSecurityScan();
