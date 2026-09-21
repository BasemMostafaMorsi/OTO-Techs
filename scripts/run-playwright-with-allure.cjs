const { spawn, spawnSync } = require('node:child_process');

const executable = 'npx';
const useShell = process.platform === 'win32';
const playwrightArgs = ['playwright', 'test', ...process.argv.slice(2)];

const testRun = spawnSync(executable, playwrightArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: useShell,
});

if (testRun.error) console.error(testRun.error);

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
  const reportServer = spawn(executable, ['allure', 'open', 'allure-report'], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: 'ignore',
    shell: useShell,
  });
  reportServer.unref();
} else {
  console.error('Allure report generation failed. See the output above.');
}

process.exitCode = testRun.status ?? 1;
