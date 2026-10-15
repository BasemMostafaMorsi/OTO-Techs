# GitHub Actions — Luxora test automation

This repository contains tests, not application source. The pipeline runs tests and delivers downloadable reports; it does not deploy Luxora or publish reports publicly.

## Triggers

- Push to main or any Pull Request: five offline decimal/CSV unit tests. No website credentials or browser installation are needed. These are helper tests, not application report tests.
- Actions → Luxora tests → Run workflow: unit tests first, then the selected website suite.
- Daily at 09:00 Africa/Cairo: unit tests followed by full-business. The native schedule timezone follows Cairo daylight-saving changes. GitHub may delay scheduled jobs during high load.
- Website choices: login (default), business-partners, manufacturing, internal-transfers, full-business.
- full-business selects all spec files except application reports and journal-validation.spec.ts (contains Trial Balance). It creates/updates test data; some legacy scenarios retain records.
- Website tests use one worker, zero automatic retries and a shared concurrency group. Existing runs are not interrupted by a newer run. Avoid simultaneous local runs against the same data; concurrency only covers this repository's Actions jobs.

## One-time GitHub setup

1. Commit and push the workflow and supporting code to the target repository's default branch (`Power-vision/automation_test`, main).
2. In repository Settings → Secrets and variables → Actions, configure repository settings below.
3. Add repository secrets `LUXORA_EMAIL` and `LUXORA_PASSWORD` using a dedicated test account. Do not upload .env or authentication state files.
4. Add repository variable `BASE_URL` (for the currently authorized test target: `https://luxora.poweritech.com`). Optional variable: `LUXORA_SALES_REP`.
5. Only dispatch trusted workflow branches. Website tests do not run on pull requests or ordinary pushes; they run on the default-branch schedule or manual dispatch. The job does not deploy the application.
6. Open Actions → Luxora tests → Run workflow → choose login first. Then choose a business suite.

The workflow must be present on the default branch for manual dispatch to appear. GitHub permissions/plan may affect environment protection options. Known application failures remain red; the pipeline does not turn failed business assertions into successes.

## Reports

Each job uploads an artifact even after a test failure, retained for seven days:

- allure-report: generated, styled HTML with English bug descriptions.
- allure-results: source results and attached evidence.
- playwright-report: Playwright HTML report.
- test-results: screenshots and failure traces.

Download/unzip the artifact. From this project run `npx allure open <downloaded-folder>/allure-report`. An interactive browser cannot open on a hosted CI runner, so CI generates and uploads the report instead; ordinary local `npm test` continues to open it automatically.

No .env, storageState, entire artifacts history or node_modules directories are uploaded. Reports may contain test business data; keep artifact access limited to the team.

## Local verification

`npm run test:ci -- unit` exercises the same CI entry point. For login/business suites, set BASE_URL, LUXORA_EMAIL and LUXORA_PASSWORD in the process environment first. This entry point intentionally requires explicit website settings rather than silently selecting the deployed site.

CI uses headless Chromium, Node 22 and Java 17. It installs dependencies with npm ci and the browser with `npx playwright install --with-deps chromium`. Test/report failures remain nonzero exit codes.

References: [Playwright CI](https://playwright.dev/docs/ci), [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).
