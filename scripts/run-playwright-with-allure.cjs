const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { enrich } = require('./enrich-allure-bugs.cjs');

const executable = 'npx';
const useShell = process.platform === 'win32';
const playwrightArgs = ['playwright', 'test', ...process.argv.slice(2)];

// Keep previous evidence, but never merge old failures into the current run.
if (fs.existsSync('allure-results')) {
  const archive = path.join('artifacts','allure-history',String(Date.now()));
  fs.mkdirSync(archive,{recursive:true});
  fs.renameSync('allure-results',path.join(archive,'allure-results'));
}

const testRun = spawnSync(executable, playwrightArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: useShell,
});

if (testRun.error) console.error(testRun.error);

if (!fs.existsSync('allure-results')) {
  console.error('No Allure results were produced. Keep allure-playwright enabled in the reporter configuration.');
  process.exit(testRun.status || 1);
}
enrich();

const reportRun = spawnSync(
  executable,
  ['allure', 'generate', 'allure-results', '--clean', '-o', 'allure-report'],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: useShell,
  },
);

if (reportRun.error) console.error(reportRun.error);

if (reportRun.status === 0) {
  require('./style-allure.cjs').styleReport();
  const reportServer = spawn(executable, ['allure', 'open', 'allure-report'], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    shell: useShell,
  });
  reportServer.unref();
} else {
  console.error('Allure report generation failed. See the output above.');
}

process.exitCode = testRun.status || reportRun.status || (testRun.error || reportRun.error ? 1 : 0);
