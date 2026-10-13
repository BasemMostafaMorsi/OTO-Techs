# Payment Vouchers coverage — 2026-10-12

Screen: Finance → Accounting → Payment Vouchers.
Suite: `tests/finance/accounting/payment-vouchers/payment-vouchers.spec.ts`.

## Scenarios

1. Blank draft submission is blocked by required-field validation.
2. Alphabetic reference is rejected with numeric-only validation.
3. Decimal sum display: 0.1 + 0.2 should display 0.3 or 0.30.
4. Adding, editing and removing lines recalculates the total.
5. Account, Bank and Treasury source types expose their respective controls.
6. Draft filter, all loaded rows and Reset.
7. Posted filter, all loaded rows and Reset.
8. Canceled filter and Reset (empty-result coverage if no records exist).
9. Unposted filter and Reset (empty-result coverage if no records exist).
10. No-match search and restoring the list by clearing search.
11. Create an owned Treasury draft, reopen its fields, edit description/value/notes, save as Draft, reload, cancel deletion, reload, confirm deletion, and search for the deleted reference.

## Evidence and data

Screenshots: `artifacts/finance/accounting/payment-vouchers/`.
Allure contains browser diagnostics separately from functional failures, response evidence and screenshots. Previous runs are retained in `artifacts/allure-history/`.

Only unique PV-E2E draft vouchers are created or changed. Source Main Treasury and line account Petty Cash are reused; no financial posting is performed. DELETE requests are issued for owned fixtures; a successful DELETE response does not by itself establish removal from the list. The exploration draft had reference 20261012001 and ID a2f58122-796d-44b4-bae7-38edd814fa68; its DELETE returned 200 but the list still returned it with archived_at populated.

## Limits

This is initial coverage, not complete Payment Vouchers coverage. Still untested: Validate/Post/Unpost and journal effects, bank/account-source saving, supplier invoice linkage, partial/over/duplicate payment rules, negative/zero limits, attachment persistence and restrictions, Repeat, permissions, concurrent edits, export contents, and Creator/date/journal/currency/tag filters. Source-type testing checks controls, not saving each source type. Application Reports remain excluded.

Early automation failures came from expecting PUT/PATCH without completing Save as Draft and from not scrolling a filtered list exceeding ten rows. They are not classified as product defects. These cases were corrected for rerun.

## Final result

The final complete 11-scenario run: 9 passed and 2 failed. Creation, edit persistence, and cancel deletion passed within the lifecycle test; its final deletion assertion failed. The decimal-display assertion also failed. A subsequent focused lifecycle rerun confirmed that exact-reference search still returns the deleted draft (not just an unfiltered initial response). Latest Allure shows that one-case confirmation; the complete run and decimal evidence remain archived.

Confirmed defects are documented in PAYMENT_VOUCHERS_BUG_REPORT_2026-10-12.md. No application code was changed or deployed.

## Requirement correction — 2026-10-12

The user confirmed that continued voucher visibility after deletion is correct system behavior. The earlier deletion defect is withdrawn, and the test no longer asserts disappearance. Successful DELETE and subsequent search evidence are retained. Historical run counts above describe the assertions used at that time, not two valid product defects. Only the decimal-display finding remains confirmed. A focused lifecycle rerun verifies the corrected expectation.

Corrected focused lifecycle rerun: 1 passed (23.3 seconds). A preceding attempt stopped before creating a voucher because the create form did not load; it is recorded separately as a loading failure. Current cumulative coverage is 10 passing scenarios and 1 confirmed decimal-display failure across runs. Allure regenerated and opened automatically after the successful rerun.
