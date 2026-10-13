# Finance Settings — 2026-10-13

Initial headed run: **11 passed**, 2.1 minutes. Follow-up run: **25 passed** (8 repeated navigation cases and 17 new cases). Combined: **28 distinct passing cases** across both runs.

Suite: `tests/finance/accounting/configuration/finance-settings/finance-settings.spec.ts`.

## Verified

- Chart of accounts: populated positive depth, disabled editing.
- Sales, Purchases, VAT, Vouchers, Financial settlement, Inventory, Banks & Treasuries, General: expected controls load; every dropdown opens with options and dismisses with Escape; selected values and voucher chips remain unchanged after dismissal, tab navigation, and reload.
- Balance sheet configuration: Equity, Liabilities and Assets groups present.
- Income statement configuration: Expenses and Revenue groups present.
- Screenshots saved under `artifacts/finance/accounting/configuration/finance-settings/` and attached in Allure alongside baseline values.

## Interpretation

No functional defect confirmed by this coverage. Initial run had 3 passes and 8 automation failures: full accessibility snapshots incorrectly included focus-dependent Clear buttons; the Vouchers baseline also captured an unfinished load. Comparisons now use values/chips and wait for loading indicators to disappear. Final rerun passed all cases. Historical run statuses are preserved; these failures are not application bugs.

Browser/environment diagnostics remain separate in Allure.

## Remaining coverage

This is not full Finance Settings coverage. Changed-value persistence, remaining required fields, numeric/date boundaries, mapping changes and downstream accounting effects are not tested. Balance sheet and Income statement tree expansion/editing are not tested. These two tabs are configuration screens; no application report was opened.

## Follow-up: saving and required selections

- Eight tab-level Save cases and one Save all case: existing values saved successfully (`is_success: true`); server settings compared before/after reload, excluding creation/update timestamps. No business setting changed.
- Eight client-validation cases: clear the first required selection in each editable tab, Save, assert invalid state and required message; reload restores baseline selection and server settings. Vouchers clears the first multi-selection.
- Invalid-write requests were guarded with browser routing and aborted if attempted. Passing cases sent zero invalid writes. This verifies client validation, not backend rejection.
- Required-field screenshots are saved alongside final screenshots in the artifact folder; validation snapshots and successful save responses are attached in Allure.
- No confirmed functional defect in this follow-up run.
