# Receipt Vouchers coverage — 2026-10-12

Result: 10 passed, 1 failed in the complete 11-test run.

Covered: blank draft required-field validation; numeric-only reference; decimal total display; adding/changing/removing lines; Account/Bank/Treasury source controls; four status filters with Reset; no-match search and clear; creation as a receipt (type 2) and Draft, reopening fields, editing description/value/notes, Save as Draft persistence, cancel deletion and confirmed deletion response.

Filter data: Canceled: 0 matching records; Draft: 5 matching records; Posted: 0 matching records; Unposted: 0 matching records. Empty results verify empty-state handling, not positive matching coverage.

Confirmed defect: 0.1 + 0.2 displays 0.30000000000000004. This is display precision evidence; persisted/posting precision has not been assessed.

Only an owned RV-E2E draft was created/edited and a DELETE was issued for cleanup. Archive/list visibility is recorded without imposing disappearance. No existing voucher was modified. No posting or application Report was used.

Suite: tests/finance/accounting/receipt-vouchers/receipt-vouchers.spec.ts.
Screenshots and fixture/cleanup evidence: artifacts/finance/accounting/receipt-vouchers/.
Allure: screenshots, decimal-total, filter-response, delete-verification and separate browser diagnostics.

Limits: initial coverage, not complete. Remaining: Validate/Post/Unpost and journal effects, customer invoice linkage, saving Bank/Account source vouchers, partial/over/duplicate receipts, negative/zero values, Terms & conditions persistence, tags and attachments, Repeat, remaining Creator/date/currency/tag filters, permissions and concurrency. Source controls were tested without saving each source type. Initial navigation once returned ERR_CONNECTION_CLOSED; retry loaded the screen.
