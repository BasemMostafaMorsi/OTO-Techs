# Internal Transfers — updated 2026-10-15

## Results

12 distinct tests have passed across the latest headed runs, not a single all-green combined run:

- Initial run: 7 basic tests passed; 5 new workflow tests stopped at an incorrect product text locator.
- Workflow rerun after locator correction: 4 passed; the filter test failed because the test concatenated record ID and date when reading textContent.
- Final targeted rerun after reading the ID paragraph separately: 2 passed (source balance and filters), 53 seconds.

Those two automation issues were corrected. Earlier failed statuses and evidence remain in archived Allure results. No functional application defect is established by these failures.

## Covered

- Required warehouses, product and quantity on an empty draft.
- Initial date/warehouses/line and Validate / Save as Draft actions.
- Add/remove unsaved lines; discard reference, notes and added lines on navigation.
- No-match search and clearing search.
- Reject matching source/destination; correct the destination; reject changing the source to the selected destination.
- With valid warehouses and gold selected, reject quantities 0 and -1 through HTTP 422 and the server quantity validation message. No assumption that aria-invalid must be set.
- Readonly balance matches product stock_details for Riyadh, changes to Jeddah and back to Riyadh.
- Create an owned draft, reload its warehouse/product/reference/quantity/notes, edit quantity and notes, reload again, cancel deletion, and confirm it still exists.
- Verify all observed product warehouse stocks are unchanged by draft creation/editing.
- Delete only the test-owned draft and verify reference search returns 0/0.
- Compare baseline IDs with From Riyadh, From Jeddah, To Makkah, Draft, Completed, and combined Riyadh → Jeddah + Completed. Reset restores baseline IDs after each case. A test-owned Draft provides a positive Draft match.

## Scope limits

Validate/approval/rejection/completion transitions and actual source/destination stock movement are not covered. Neither are Date filtering, other status filters with suitable records, multi-page lists, insufficient-stock rules, fractional quantities, attachments, terms or permissions. Filter comparisons explicitly require a one-page complete baseline and fail rather than silently comparing an incomplete list.

## Evidence

- Tests: tests/finance/inventory/transfer/internal-transfer/internal-transfer.spec.ts and internal-transfer-workflow.spec.ts.
- Current screenshots: test-results/ and current Allure attachments. Earlier screenshots/response evidence: artifacts/allure-history/.
- Manual screenshots and run logs: artifacts/finance/inventory/transfer/internal-transfer/.
- Allure preserves browser/HTTP diagnostics separately from functional outcomes. HTTP 500 during initial navigation was observed while the page subsequently loaded; it is not treated as proof of a transfer workflow failure.
- The earlier 315-test parallel run is preserved separately at artifacts/parallel-run/allure-report/ (262 passed, 35 failed, 1 broken, 17 skipped). Its lightweight report omits trace ZIP copies to conserve disk; original evidence remains archived.
