# Finance findings — 2026-09-30

## Sales Invoice CSV export (RPT-02): Fail

Reproduction: Finance → Reports → Sales invoice → Export → Export Excel.
Repeat after selecting a customer in Filter. The download is CSV.

- Latest unfiltered and customer-filtered downloads contain 11 additional unnamed
  columns after `Created At`. The strict parser rejects this schema, preserving
  the actual CSV as an attachment instead of dropping columns silently.
- Earlier exports with valid headers show invoices #2 and #3 as `Partially Paid`
  although their source list and report show `Paid`. Their exported remaining
  amounts are blank while the screen shows zero.
- The first schema failure prevents subsequent field assertions in the latest
  run; do not interpret it as re-verification of every older discrepancy.

Evidence: `artifacts/finance/latest-browser-results.json`, exported files and
screenshots in `artifacts/finance/latest-browser-results/`.
Earlier field mismatch evidence: `artifacts/finance/browser-results.json`.

## Sales Invoice source/report reconciliation: Pass within tested scope

Source IDs, customer, total, remaining amount and payment status match the
report. Exact minor-unit sums match the report's Amount and Total footer.
Customer filtering, refresh and reset pass. This is read-only reconciliation
of existing records, not proof of journal posting, settlement or stock effects.

The adapter requires all records to be visible (`n/n`). It fails explicitly
if that condition is not met; multi-page traversal has not been implemented.
Other report types, zero-state, sorting, PDF export and column-selection parity
remain untested. Five utility tests cover decimal arithmetic and CSV parsing.

## Trial balance arithmetic and complete loading: Pass within tested scope

All 319 account rows loaded through the UI in successive batches. The test
checks each account's signed net movement and opening + movement = closing,
equality of debit/credit footer pairs, and root-account transaction totals
without adding both parents and children. Display precision is preserved with
three decimal places; no floating point arithmetic is used.

Two rows (`VAT payable`, `Vat Tax EXP`) have no displayed account code. Their
eight monetary values are all zero. They remain included in row counting and
arithmetic checks; the test refuses hierarchy aggregation if an unnumbered
account has a nonzero value. This does not establish source journal posting,
Balance Sheet, Income Statement or equity reconciliation required by FIN-01.

Evidence: `artifacts/finance/trial-balance-results.json` and
`artifacts/finance/trial-balance-all-accounts.png`.

## Environment identity awaiting clarification

The user specified company `oto`; Company profile currently displays English
name `new compony`, Arabic name `new`. No financial mutations were executed.
The journal form's two account selectors were explored without saving.

## Browser diagnostics

Some document navigations return HTTP 500 while the client renders and report
API requests succeed. Browser diagnostics are attached separately; a passing
financial assertion does not imply a clean browser console or healthy server
rendering.
