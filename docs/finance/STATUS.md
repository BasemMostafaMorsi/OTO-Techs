# Finance scenario execution status

Company named by the user: oto. This inventory is not a claim that the 45 end-to-end cases are implemented or passed.

Current scope (2026-10-04): application report testing is excluded by user request.
The current journal workflow checks persisted details and UI states only.
See `docs/JOURNAL_WORKFLOW_2026-10-04.md`; report results below are historical.

The user confirmed on 2026-10-01 that the current `new compony` / `new`
company is the intended oto test environment. Use uniquely identified test
records for new workflows. A specific disposable closing period is still
required before executing period-close tests.

Latest combined run (2026-10-04): 16 tests, 12 passed and 4 failed across Contacts
and Finance. Finance passes include five utility checks, complete Trial Balance
arithmetic and ACC-02 UI rejection with unchanged grand totals. Sales Invoice
source reconciliation and customer-filter comparison now fail, alongside both
CSV exports. These checks do not establish completion of the 45-case matrix.
See `docs/RUN_REVIEW_2026-10-04.md` for evidence and follow-up results.

| ID | Priority | Requirement | Status | Evidence / remaining work |
|---|---|---|---|---|
| ACC-01 | P0 | Post balanced manual journal, two accounts | Supporting check passes | SAR 0.10 journal posted via Draft → Validate → Post; grand debit/credit movement increases by 0.10 each. Individual account rows and other reports remain. |
| ACC-02 | P0 | Attempt unbalanced journal | Pass (UI) | Debit 0.10 / credit 0.09 rejected; no finance write request; Trial Balance grand totals unchanged. Server-side bypass validation not tested. |
| ACC-03 | P1 | Draft then post journal | Supporting check passes | Draft persists, leaves grand totals unchanged, then Validate → Unposted → Post → Posted succeeds. Grand-total reconciliation passes. |
| ACC-04 | P1 | Reverse/cancel posted journal | Partial / Unpost UI passes | Corrected rerun passes Unpost → Unposted with persisted details; former Draft expectation and bug classification withdrawn. Cancellation and reversal journals remain untested; report checks are excluded. |
| ACC-05 | P1 | Post journal assigned to cost center and location | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-06 | P1 | Journal with foreign currency and exchange rate | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-07 | P0 | Create payment voucher against supplier payable | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-08 | P0 | Create receipt voucher against customer receivable | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-09 | P1 | Partial, over, and duplicate voucher payment | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-10 | P1 | Payment/receipt across two banks or treasuries | Not run | Workflow and before/after report reconciliation not yet implemented. |
| ACC-11 | P1 | Close accounting period, attempt backdated posting | Blocked | An isolated accounting period to close has not been specified. |
| SAL-01 | P0 | Quotation → order → credit sales invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-02 | P0 | Cash sales invoice and generated receipt | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-03 | P0 | Partial payment, then settle invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-04 | P0 | Sales return / credit note with linked original invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-05 | P1 | Sales invoice with discount, extra charge, VAT and two lines | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-06 | P1 | Sales by two locations, representatives, customers | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-07 | P1 | Invoice due today and past due at bucket boundaries | Not run | Workflow and before/after report reconciliation not yet implemented. |
| SAL-08 | P1 | Cancel draft versus completed sales invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-01 | P0 | Material request → RFQ → PO → credit purchase invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-02 | P0 | Cash purchase invoice and payment voucher | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-03 | P0 | Partial supplier payment and settlement | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-04 | P0 | Purchase return linked to invoice | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-05 | P1 | Two suppliers/locations and mixed VAT rates | Not run | Workflow and before/after report reconciliation not yet implemented. |
| PUR-06 | P1 | Reject duplicate supplier invoice reference or invalid total | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-01 | P0 | Purchase invoice creates receipt; complete receipt | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-02 | P0 | Sales invoice creates delivery; complete delivery | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-03 | P0 | Internal transfer A → B | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-04 | P1 | Manual receipt and delivery with unique reference | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-05 | P1 | Scrap quantity | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-06 | P1 | Stocktaking variance, positive and negative | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-07 | P1 | Manufacturing consumes components and receives finished item | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-08 | P1 | Same product in two warehouses, units of measure and conversion | Not run | Workflow and before/after report reconciliation not yet implemented. |
| INV-09 | P2 | Product under request threshold and slow/non-moving product | Not run | Workflow and before/after report reconciliation not yet implemented. |
| TAX-01 | P0 | Taxable sale and purchase with configured VAT rates | Not run | Workflow and before/after report reconciliation not yet implemented. |
| TAX-02 | P1 | Exempt, zero-rated, tax-free, rounding and credit notes | Not run | Workflow and before/after report reconciliation not yet implemented. |
| FIN-01 | P0 | Posted debit/credit across asset, liability, equity, revenue, expense | Not run | Supporting all-account Trial Balance arithmetic passes. Creating a journal and reconciling Balance Sheet, Income Statement and equity remain. |
| FIN-02 | P0 | Revenue and expense by location, contact, cost center | Not run | Workflow and before/after report reconciliation not yet implemented. |
| FIN-03 | P1 | Payment/receipt across period boundary | Not run | Workflow and before/after report reconciliation not yet implemented. |
| FIN-04 | P1 | Opening balance and period close | Blocked | An isolated accounting period to close has not been specified. |
| RPT-01 | P0 | For each report: filter, refresh, pagination, sort | Not run | Sales Invoice source parity, total sums, customer filter, refresh and reset pass. Trial Balance loads all 319 accounts and verifies arithmetic/root totals. Other reports, zero state and sorting remain. |
| RPT-02 | P1 | Export each report with active filters/columns | Fail | Sales Invoice CSV has unnamed extra columns; earlier exports also mismatch Paid status and zero outstanding. Other report/PDF/column variants remain. |
| RPT-03 | P1 | Date ranges, timezone, boundary and multi-currency | Not run | Workflow and before/after report reconciliation not yet implemented. |
| RPT-04 | P1 | Drill-down from row to source document and journal | Not run | Workflow and before/after report reconciliation not yet implemented. |
| RPT-05 | P1 | Role-limited user views Finance | Not run | Workflow and before/after report reconciliation not yet implemented. |


