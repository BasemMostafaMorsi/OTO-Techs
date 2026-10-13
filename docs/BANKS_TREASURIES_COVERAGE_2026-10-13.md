# Banks & Treasuries coverage — 2026-10-13

Final run: 7 passed, 1 failed (1.9 minutes).

Passed: required fields for Bank and Treasury; manual-account requirement and automatic-mode visibility for both; separate owned Bank and Treasury create/edit/reopen/notes/status-toggle/cancel-delete/confirm-delete lifecycles; no-match search and clearing.

Observed UI inconsistency: Status filter offers Draft, Posted, Canceled and Unposted, whereas row status is active/inactive. Backend behavior of these options is not established. Screenshot and status-options JSON are in Allure. No missing/incorrect filtered records are claimed.

Initial failures were a bank account already linked elsewhere (valid rejection), wrong Save locator on the Update screen, and unavailable Active/Inactive filter options. Lifecycle tests now use automatically created independent accounts. Fixture files include account_id when returned; successful DELETE responses for new bank/treasury records are logged. Generated chart accounts were not independently deleted or audited after bank/treasury deletion.

Retained prior fixture: treasury ID 12, BT-E2E-Treasury-1791811532018, manually linked to Petty Cash. On 2026-10-13 its displayed balance was -0.600, so it was inspected read-only and left untouched. No test posted money or modified existing banks/treasuries.

Suite: tests/finance/accounting/configuration/banks-treasuries/banks-treasuries.spec.ts.
Evidence: artifacts/finance/accounting/configuration/banks-treasuries/ and Allure.

Limits: not full coverage. Currency/Keepers/Tags filters, export contents, Optimize persistence, attachments, invalid IBAN/SWIFT formats, transfers, currency conversion, posting effects, permissions/concurrency, and generated-account cleanup semantics remain untested. Application Reports excluded.
