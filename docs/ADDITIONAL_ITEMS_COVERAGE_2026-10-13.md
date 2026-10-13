# Additional Items — 2026-10-13

Headed run: **6 passed**, 1.1 minutes.

Suite: `tests/finance/accounting/configuration/additional-items/additional-items.spec.ts`.

## Verified

1. Blank submission requires Name and Pages.
2. Name without Pages is rejected.
3. Pages without Name is rejected.
4. Available page choices are Journal Entries, Payment Vouchers and Receipt Vouchers. Unsaved name, description and page selections are discarded on navigation.
5. No-match search returns 0/0; clearing restores the original count.
6. Owned AI-E2E item: create with Journal Entries; reopen name/description/mapping; discard unsaved edit; save edited name/description and all three page mappings; reopen and verify persistence; cancel deletion and verify record remains; confirm deletion and record response/post-delete visibility.

## Evidence and interpretation

- Screenshots: `artifacts/finance/accounting/configuration/additional-items/`, attached in Allure.
- Fixture ID/name ledger: `fixture.json` in the same folder. Delete response and post-delete observation are attached in Allure.
- No confirmed functional failure in this run. Browser/environment diagnostics are separate.
- Deletion success is checked at HTTP level and its body is retained; post-delete visibility is observed, not assumed to imply a defect.
- Exploratory UI wording uses “Terms & Conditions” for deletion and “Unit created successfully” for creation; not classified as a workflow failure.

## Not yet covered

Filters, export, Optimize, pagination with larger data sets, duplicate/whitespace/length boundaries, removing individual saved page mappings, permissions, and use of additional items inside journal/voucher forms. This is initial coverage, not full module coverage.
