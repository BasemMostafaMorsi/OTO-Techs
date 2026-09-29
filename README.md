# OTO Tech ERP Automation

Playwright end-to-end tests for the Luxora ERP web application.

## First run in PowerShell

```powershell
$env:BASE_URL = 'https://luxora.poweritech.com'
$env:LUXORA_EMAIL = 'your-automation-user@example.com'
$env:LUXORA_PASSWORD = 'your-password'
npm run test:smoke
```

Use a dedicated automation account. Credentials are read from environment variables and must not be committed.

## Commands

- `npm test` — run all tests.
- `npm run test:smoke` — run the smoke suite.
- `npm run test:headed` — run with a visible browser.
- `npm run test:debug` — open Playwright Inspector.
- `npm run report` — open the latest HTML report.

Every test saves a screenshot in `test-results`. Browser console errors, page
exceptions, failed requests, and HTTP error responses are attached to the report.
Failures also retain video and Playwright traces by default. Set
`LUXORA_LIGHT_ARTIFACTS=1` to keep screenshots and diagnostics without video/traces
when disk space is limited. Browsers are visible locally and headless in CI.

This repository contains the test suite, not the Luxora application source or a
local application server. `BASE_URL` selects the application under test.
Lifecycle tests create `AUTO` data on that application. Contact records are
deleted in `finally`; permission changes are restored in `finally`. Employee,
category, and material-request tests retain their generated records.

The contact representative assignment requires a representative in the same
business tree as the contact. Set `LUXORA_SALES_REP` to that representative's name.
Without it the first available option is exercised; a tree-membership rejection
is reported explicitly and must not be mistaken for a confirmed application bug.

## Current smoke coverage

1. User login and application access.
2. Inline Product Category creation and immediate selection.
3. Material Request → Purchase Order conversion:
   - Product and quantity transfer.
   - UOM, purchase price, and net total validation.
4. Purchase Order form business fields and sections.
5. Sales Invoice required fields, transaction tabs, and totals.
6. System Admin permission tree and summary loading.
7. User Management employee list, statistics, actions, and create form.
8. User Management permissions list and assigned-role visibility.
9. Employee lifecycle: create, preview, update, and export.
10. Employee permission update, persistence check, and safe restoration.
11. Contact lifecycle: create, preview, export, transform, edit, full filter, and delete.

## Regression coverage

1. Inline Product Category creation in Arabic and immediate selection.
2. Customer Payment Terms dropdown scroll isolation.
3. Project Add Country modal labels and translation action.
4. Contact attachment file-type restrictions.
5. System Admin Finance tree expansion.
6. System Admin Select All counter behavior and restoration.
7. Employee and permissions-list search behavior.
8. Employee Area/City parent-field dependencies.

Known defects use `known-issue` annotations rather than `test.fail`. They fail
normally until fixed, so an unrelated locator, authentication, or setup failure
cannot be counted as a passing expected failure. Review the actual assertions and
browser diagnostics when classifying a failure.

## Next scenarios

1. Contact creation and customer/vendor transformation.
2. Sales and purchase invoice payment-total calculations.
3. Contact attachments and notes persistence on the details page.
