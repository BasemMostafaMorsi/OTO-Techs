# Inventory Transfer Receipts — 2026-10-14

Final headed run: **6 passed**, 1.4 minutes.

Suite: `tests/finance/inventory/transfer/receipts/receipts.spec.ts`.

## Verified

- Blank Save as Draft validates counterparty, product, quantity and unit price.
- Date populated/disabled, warehouse populated, Customer default, one initial line; Save offers Validate and Save as Draft.
- Add/remove unsaved item rows.
- Select existing gold product, read the displayed positive unit price, enter quantity 2; line total and grand total equal 2 × displayed price.
- Navigating away discards unsaved reference, notes and extra line.
- No-match search returns 0/0; clearing restores visible receipt records.

Screenshots and line-value evidence are in `artifacts/finance/inventory/transfer/receipts/` and Allure. Initial calculation failure was an automation assumption: unit price was read-only before selecting a product. Corrected rerun passed. No calculation defect confirmed.

No receipt was successfully saved or validated; no stock movement was made. Initial CLI exploration showed some existing rows displaying `undefined` in customer/supplier cells; this observation is not yet isolated or classified as a functional failure.

## Remaining

Successful draft creation/edit/deletion, Validate lifecycle and stock/journal effects, all filters, counterparty-type dependencies, multiple-line calculations, numeric/date boundaries, attachments, terms, permissions and full pagination checks remain unverified. This is initial coverage, not complete coverage.
