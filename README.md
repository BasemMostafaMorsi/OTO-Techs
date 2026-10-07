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

The contact representative assignment step is skipped at the user's request
because representative/contact tree membership remains unresolved. Its code is
retained inside a reported skipped step; the rest of the contact lifecycle runs.
Before re-enabling that step, select a representative in the contact's business
tree using `LUXORA_SALES_REP` and remove the explicit `step.skip` call.

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
11. Contact lifecycle: create, preview, export, edit, full filter, and delete;
    representative assignment is explicitly skipped.

## Regression coverage

Customer screen coverage and its explicit limits are documented in
[docs/CUSTOMERS_COVERAGE_2026-10-06.md](docs/CUSTOMERS_COVERAGE_2026-10-06.md).
Vendor coverage is documented separately in
[docs/VENDORS_COVERAGE_2026-10-06.md](docs/VENDORS_COVERAGE_2026-10-06.md).
Projects coverage and limits are in
[docs/PROJECTS_COVERAGE_2026-10-07.md](docs/PROJECTS_COVERAGE_2026-10-07.md).
Customer Categories coverage is in
[docs/CUSTOMER_CATEGORIES_COVERAGE_2026-10-07.md](docs/CUSTOMER_CATEGORIES_COVERAGE_2026-10-07.md).
Classifications coverage is in
[docs/CLASSIFICATIONS_COVERAGE_2026-10-07.md](docs/CLASSIFICATIONS_COVERAGE_2026-10-07.md).
Run it with `npm test -- tests/business-partners/vendors/vendors.spec.ts`.
Run the customer suite (without application report tests) using:

```powershell
npm test -- tests/business-partners/customers/customers.spec.ts tests/business-partners/contacts/payment-terms-dropdown.spec.ts
```

1. Inline Product Category creation in Arabic and immediate selection.
2. Customer Payment Terms dropdown scroll isolation.
3. Project Add Country modal labels, country-name entry and cancellation.
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

Finance requirements and execution status are tracked in
[docs/finance/STATUS.md](docs/finance/STATUS.md); confirmed discrepancies are in
[docs/finance/FINDINGS.md](docs/finance/FINDINGS.md).
`tests/finance/scenarios.ts` is the 45-case requirements inventory, not 45
implemented tests. Application report tests are currently excluded by user
request. Run Journal Items with:

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/finance/accounting/journal-items
```

Screenshots are saved under `artifacts/finance/`; CSV files and browser
diagnostics are attached to the test results. The existing environment-managed
login is required. No finance posting or period close is performed by these
read-only tests.

Every `npm test` run archives previous Allure results, adds English bug reports
to failed results (Module, Type, Severity, Priority, Steps to Reproduce, Actual
Result, Expected Result), generates Allure, and opens it automatically. Browser
diagnostics remain separate from functional failures. To enrich and reopen an
existing run, use `npm run report:allure`. Direct `npx playwright test` does not
run the wrapper; use the npm commands for this workflow.

1. Contact creation and customer/vendor transformation.
2. Sales and purchase invoice payment-total calculations.
3. Contact attachments and notes persistence on the details page.

## Test folders follow the ERP navigation

```text
tests/
  business-partners/
    contacts/
    projects/
  finance/
    accounting/
      journal-entries/
      journal-items/
    inventory/
      products/
    purchase/
      material-requests/
      purchase-orders/
    sales/
      invoices/
    reports/
      sales-invoice/
      trial-balance/
    helpers/
    unit/
    scenarios.ts
  user-management/
    employees/
    permissions/
  system-admin/
  smoke/
  helpers/
  fixtures/
```

Place new UI tests under the matching ERP module and screen. Shared helpers and
fixtures remain separate from screen folders; finance utility tests live in
`finance/unit`. Filenames remain stable so Allure bug classification continues
to identify the same scenarios.

For Journal Entries without application report checks, select the two files
explicitly (the historical `journal-validation.spec.ts` still opens Trial Balance):

```powershell
npm test -- tests/finance/accounting/journal-entries/journal-entries.spec.ts tests/finance/accounting/journal-entries/journal-posting.spec.ts
```

After the folder reorganization, Playwright discovery found the same 56 tests in
25 files. Discovery used `--list`; it did not execute application tests or replace
the latest Allure results.
