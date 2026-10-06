# Journal Entries coverage — 2026-10-06

Command: `npm test -- tests/finance/accounting/journal-entries/journal-entries.spec.ts tests/finance/accounting/journal-entries/journal-posting.spec.ts`

Latest run: **12 passed, 0 failed (7.2 minutes)**. Both earlier automation failures
were resolved: Preview navigation/search synchronization and decimal-text matching.
Allure contains current screenshots and separate browser/environment diagnostics;
passing functional assertions do not clear those diagnostics.

Scope: Journal Entries UI only. Application reports, Trial Balance and report exports are excluded. Journal-list download is included; its contents are not reconciled.

## Automated checks (12 tests)

- Load the complete list; stable counter, expected row count, no duplicate row text; search with no results and clearing search.
- Download a nonempty journal-list export without a download error.
- Empty-form required fields; no journal creation request.
- Nonnumeric reference rejection; no journal creation request.
- Unbalanced amounts rejection; no journal creation request.
- Create own draft with notes and valid image attachment; reopen and check persistence; edit description and save as Draft; search reference; Preview opens the selected journal; cancel deletion, then delete only the test draft in cleanup.
- Three-line decimal totals: 0.10 + 0.20 = 0.30; edit to 0.25 and verify total 0.35 and difference 0.05 without saving.
- Status filters: Draft, Posted, Unposted and Canceled (one test each). Assertions cover loaded rows, not all filtered pages.
- Lifecycle: Draft → Validate → Unposted → Post → Posted → Confirm Unpost → Unposted; persisted reference/description/amounts; Cancel → Go Back preserves status; Confirm Cancel produces Canceled and hides Post.

## Limits and remaining coverage

This is not exhaustive coverage of every possible Journal Entries behavior.

- Only SAR was available during exploration; foreign-currency/exchange-rate behavior is not covered.
- Date/account/creator/currency/tag filters and combinations, sorting and Optimize are not yet covered.
- Tax, contact, location and cost-center mapping, duplicate reference policy, zero/negative/large amount boundaries, row removal/reordering and attachment removal/unsupported files remain.
- Role-based access and server-side validation bypass attempts are not covered.
- Preview navigates to the selected journal's edit route. The current test verifies identity/details, not a separate read-only requirement.
- No ledger/report reconciliation is performed under the current scope.

Screenshots are stored under `artifacts/finance` and attached to Allure. Draft CRUD tests remove their own records; lifecycle tests retain their uniquely named canceled records for audit. Historical exploratory records should not be assumed cleaned up.
