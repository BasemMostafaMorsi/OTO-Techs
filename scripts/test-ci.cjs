const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const suites = {
  unit: ['tests/finance/unit'],
  login: ['tests/smoke/auth.spec.ts'],
  'business-partners': ['tests/business-partners'],
  finance: ['tests/finance'],
  manufacturing: ['tests/finance/inventory/transfer/manufacturing'],
  'internal-transfers': ['tests/finance/inventory/transfer/internal-transfer'],
  'full-business': ['tests'],
};
function selectFiles(suite) {
  if (!Object.hasOwn(suites, suite)) throw new Error('Unknown CI suite: ' + suite);
  function visit(file) {
    if (fs.statSync(file).isDirectory()) return fs.readdirSync(file).flatMap(name => visit(path.join(file, name)));
    const normalized = file.replaceAll('\\', '/');
    if (!normalized.endsWith('.spec.ts') || normalized.includes('/reports/') || normalized.endsWith('/journal-validation.spec.ts')) return [];
    return [normalized];
  }
  const files = suites[suite].flatMap(visit).sort();
  if (!files.length) throw new Error('No tests found for ' + suite);
  return files;
}
function run(suite) {
  const files = selectFiles(suite);
  if (suite !== 'unit') {
    for (const key of ['BASE_URL', 'LUXORA_EMAIL', 'LUXORA_PASSWORD']) {
      if (!process.env[key]) throw new Error('Missing required CI setting: ' + key);
    }
    const url = new URL(process.env.BASE_URL);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('BASE_URL must be an HTTPS URL without credentials.');
  }
  console.log(`CI suite ${suite}: ${files.length} explicitly selected test files; application reports excluded.`);
  const result = spawnSync(process.execPath, [path.join(__dirname, 'run-playwright-with-allure.cjs'), ...files, '--workers=1'], {
    stdio: 'inherit', env: {...process.env, CI: 'true', LUXORA_LIGHT_ARTIFACTS: '1'},
  });
  process.exitCode = result.status ?? 1;
  if (result.error) console.error(result.error.message);
}
module.exports = {selectFiles};
if (require.main === module) {
  try { run(process.argv[2] || 'unit'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
