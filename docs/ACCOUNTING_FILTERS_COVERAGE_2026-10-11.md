# Accounting filter coverage — 2026-10-11

## Scope

Accounts: Creator, Creation date, Main account, Type (Credit/Debit), Status (Active/Inactive), Level (1/5), Currency (SAR/EGP), Financial guidance, Cash flow (Operating/Investing Activities), Tags (tag1/1200), Hide zero values, and a combined Creator + Parent + Active + tag1 selection: 18 scenarios.

Cost Centers: Creator, Creation date, Main cost center, Status (Active/Inactive), Tags (tag1/1200), Hide zero values, and the same combined selection: 9 scenarios.

Each scenario compares every filtered API page against an independently filtered, fully loaded unfiltered baseline. Visible names, account numbers and status switches are also compared to returned records. Reset checks the unfiltered total, first-page IDs and absence of filter query parameters.

Two uniquely named FILTER-E2E fixtures provide positive tag and status cases per screen, and are removed in afterAll. The existing dedicated primary Cost Center is reused. No original accounts or centers are modified; no journals or reports are involved.

## Results

Cost Centers: all 9 scenarios passed across the full rerun (8 passed) and the corrected Hide-zero rerun (1 passed). Initial mismatches came from capturing a stale request and counting the empty-state placeholder as a data row; these were automation issues, not confirmed application defects.

Accounts: 15 of 18 scenarios passed across runs. The full run had 14 passes and 4 failures: EGP lacked a positive fixture, then passed after adding an EGP fixture; Hide zero and both Cash flow scenarios failed with confirmed functional discrepancies. All 9 Cost Center scenarios passed across runs. Overall: 24 passing scenarios and 3 failing scenarios representing 2 defects, across 27 filter scenarios. This is cumulative coverage, not one clean combined run.

A final read-only focused run reproduced all 3 failing cases: Operating Activities returned 7 nonmatching records on the first page, Investing Activities returned 10, and both retained the unfiltered total of 324. Hide zero removed Main treasury with balance -4139.400. The earlier full-page comparison returned 326 accounts including fixtures for either Cash flow choice (expected 64 Operating / 14 Investing), and Hide zero returned 38 of 51 nonzero accounts.

The current Allure report contains the final 3-case defect confirmation run. Earlier full coverage and the passing EGP rerun remain in artifacts/allure-history. The sandbox browser-launch failure was an environment issue; the subsequent run with the installed browser passed. See ACCOUNTING_FILTERS_BUG_REPORT_2026-10-11.md.

## Evidence and limits

Screenshots, baseline summaries, fixture/cleanup ledgers: artifacts/finance/accounting/{accounts,cost-centers}/filters. Per-test Allure attachment: filter-comparison. Previous runs are archived by the wrapper.

Low-memory execution uses LUXORA_LIGHT_ARTIFACTS=1: screenshots and JSON evidence retained, video/trace disabled. Earlier process-memory and login failures are environment/setup failures; affected skipped tests are not passes.

Date coverage currently uses an inclusive same-day range containing the new fixtures. Not every calendar boundary, multi-select combination or possible value is covered. Cost Center balances were all zero, so Hide-zero verifies exclusion to an empty result; retention of a nonzero Cost Center is not tested. Accounts include nonzero balances. Reset compares the complete baseline total and first page, not every restored page.
