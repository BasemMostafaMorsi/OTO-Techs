# Luxora Finance — Automation Coverage & Report Reconciliation

Reviewed: 29 September 2026. Scope observed in the signed-in Finance navigation: Accounting, Inventory, Sales, Purchase, Tax center, Dashboard, Reports, and configuration. This is a test design, not a claim that all cases passed. Run state-changing cases in an isolated test company or with explicitly disposable test data.

## Evidence observed

- Sales invoice **#33** is `Completed`, `Unpaid`, customer **Basem #20**, total and remaining **1.10**, with journal **#187** in the Sales Invoices list. The Sales Invoice report shows **sales invoice #33**, Basem #20, amount and total **1.10**, status **Unpaid**. Result: **the invoice appears in this report and these sampled fields match**. Its journal posting and other reports were not reconciled.
- The Sales Invoice report offers Refresh, Filter, Export, column settings, and a Total row. Its sampled report displayed 15/33 records while the source list displayed 20/32 at observation time. Page counts and summary totals therefore need filter and pagination reconciliation; the difference alone is not a confirmed defect.

## Execution contract for every automated case

1. Use a unique run ID in reference or memo (for example `FIN-E2E-<timestamp>`), a fixed accounting date, a dedicated customer/supplier/product and known currency, tax, location, warehouse, cost center, and payment terms. Record source document ID, journal ID, and voucher/stock movement IDs.
2. Read the target report **before** the action with the same date range, company, status and filters. Save matching row and aggregate baseline; distinguish draft from posted/completed state.
3. Perform action through UI (or an authorized fixture API), assert saved source fields, status and related IDs. Refresh the report and poll within a bounded latency agreed with the product owner; compare both matching row and aggregate delta. Never use a fixed sleep or only assert nonempty tables.
4. Assert exact decimal values with currency precision, not floating point equality. For grouped reports, filter by the relevant dimension. Recalculate totals from all filtered pages and compare export to screen using the same filter set. Capture screenshots and source/report IDs on failure.
5. Clean up only disposable test data via supported reversal/cancellation. If reversal is unavailable, isolate by run ID and period. Do not delete or alter existing business records.

**Accounting rule:** `Σ debit = Σ credit` for each posted journal and trial balance. Report direction depends on configured chart of accounts, tax, posting, costing, and recognition policies; confirm account mappings and timing before fixing exact expected ledger deltas.

## Scenario matrix

| ID | Priority | Source action / variant | Report assertions (source → report) | Core oracle |
|---|---|---|---|---|
| ACC-01 | P0 | Post balanced manual journal, two accounts | Journal entries/items → Trial balance, Statement of account, Balance sheet or Income statement | One journal ID; debit=credit; each account movement matches; statement changes by classified account |
| ACC-02 | P0 | Attempt unbalanced journal | Journal entries/items, Trial balance | Validation rejects posting; no new report movement |
| ACC-03 | P1 | Draft then post journal | Journal items, Trial balance | Draft excluded from posted totals; one movement after posting only |
| ACC-04 | P1 | Reverse/cancel posted journal | Journal items, account statement, Trial balance | Reversal entry offsets original once; audit trail preserved |
| ACC-05 | P1 | Post journal assigned to cost center and location | Detailed/Statement of cost center, P&L by cost center/location | Amount appears only in chosen dimensions; grand total reconciles to ledger |
| ACC-06 | P1 | Journal with foreign currency and exchange rate | Statement of account, Trial balance, Balance sheet | Currency and base amounts use configured rate and rounding; balance remains zero |
| ACC-07 | P0 | Create payment voucher against supplier payable | Payment vouchers → Supplier invoice payment, Supplier open purchase invoices, A/P ageing, Cashflow, Statement of vendor | Paid rises, outstanding falls, bank/cash falls, no duplicate payment |
| ACC-08 | P0 | Create receipt voucher against customer receivable | Receipt vouchers → Customer invoice payment, Customer open sales invoices, A/R ageing, Cashflow, Statement of customer | Paid rises, outstanding falls, bank/cash rises, payment linked to invoice |
| ACC-09 | P1 | Partial, over, and duplicate voucher payment | Invoice payment, ageing, account statement | Partial balance exact; overpayment follows configured policy; duplicate rejected or posted distinctly per policy |
| ACC-10 | P1 | Payment/receipt across two banks or treasuries | Cashflow, Statement of account, Balance sheet | Correct bank only and account balance matches voucher |
| ACC-11 | P1 | Close accounting period, attempt backdated posting | Journal, all relevant reports | Closed-period rule enforced; no unauthorized historical delta |
| SAL-01 | P0 | Quotation → order → credit sales invoice | Sales Invoice, Customer transaction, Customer balance, A/R ageing detailed/open invoices, Trial balance | Quote/order do not post unless policy says so; invoice posts once; exact invoice total and receivable |
| SAL-02 | P0 | Cash sales invoice and generated receipt | Sales Invoice, Customer invoice payment, Cashflow, Statement of customer, Trial balance | Paid status, zero outstanding, receipt link, cash and revenue/tax postings reconcile |
| SAL-03 | P0 | Partial payment, then settle invoice | Customer invoice payment, Customer open sales invoices, A/R ageing, Customer balance | Outstanding = invoice total − sum applied receipts; status transitions once |
| SAL-04 | P0 | Sales return / credit note with linked original invoice | Sales summary, Customer transaction, A/R ageing, VAT details, stock movement | Revenue/receivable/tax reverse by return value; stock increases when physical return completed |
| SAL-05 | P1 | Sales invoice with discount, extra charge, VAT and two lines | Sales Invoice, VAT details, Transaction with/without VAT, P&L | Subtotal ± adjustments + tax = invoice total; report totals match source and journal |
| SAL-06 | P1 | Sales by two locations, representatives, customers | Location sales summary, Customer sales summary/income, P&L by location/contacts | Correct grouping and grand total; no cross-location leakage |
| SAL-07 | P1 | Invoice due today and past due at bucket boundaries | A/R ageing and detailed, Customer open sales invoices | Each unpaid amount appears in exactly one ageing bucket based on due date and as-of date |
| SAL-08 | P1 | Cancel draft versus completed sales invoice | Sales Invoice, customer statements, Trial balance | Draft excluded; cancellation/reversal follows status policy without orphan entries |
| PUR-01 | P0 | Material request → RFQ → PO → credit purchase invoice | Purchase Invoice, Supplier transaction, Supplier balance, A/P ageing/open invoices, Trial balance | Pre-invoice steps follow posting policy; invoice payable, expense/inventory, tax post exactly once |
| PUR-02 | P0 | Cash purchase invoice and payment voucher | Supplier invoice payment, Cashflow, Statement of vendor, Trial balance | Zero outstanding, voucher link and bank movement equal paid amount |
| PUR-03 | P0 | Partial supplier payment and settlement | Supplier open purchase invoices, A/P ageing detailed, Supplier balance summary | Remaining = invoice − applied payments; due bucket and status update |
| PUR-04 | P0 | Purchase return linked to invoice | Purchase Invoice, Supplier transaction, A/P ageing, VAT details, Inventory movement | Payable/tax/cost/stock reverse as appropriate and original linkage visible |
| PUR-05 | P1 | Two suppliers/locations and mixed VAT rates | Supplier purchase summary/income, Location purchase summary, VAT details | Grouped totals and tax rates match invoice lines and consolidated total |
| PUR-06 | P1 | Reject duplicate supplier invoice reference or invalid total | Purchase Invoice, Supplier transaction | No second posting or report row for rejected attempt |
| INV-01 | P0 | Purchase invoice creates receipt; complete receipt | Receipts, Stock availability, Inventory movement detailed, Inventory valuation | Warehouse quantity rises by accepted quantity; inventory value rises by configured cost |
| INV-02 | P0 | Sales invoice creates delivery; complete delivery | Deliveries, Stock availability, Item sales consumption, Inventory valuation, P&L | Quantity falls once; cost of goods recognized per valuation policy |
| INV-03 | P0 | Internal transfer A → B | Inventory movement detailed, Stock availability, Inventory valuation | A −q, B +q, company total quantity/value unchanged subject to transfer costs |
| INV-04 | P1 | Manual receipt and delivery with unique reference | Inventory movement detailed, Stock availability, Inventory valuation | Correct source/receipt/delivery IDs, quantity and cost in reports |
| INV-05 | P1 | Scrap quantity | Inventory movement detailed, Stock availability, Inventory valuation, P&L | Quantity/value decreases and configured loss account changes |
| INV-06 | P1 | Stocktaking variance, positive and negative | Inventory movement detailed, Stock availability, Inventory valuation | System quantity adjusts to count; variance and journal reconcile |
| INV-07 | P1 | Manufacturing consumes components and receives finished item | Inventory movement detailed, Stock availability, Inventory valuation | BOM quantities and value conserved/allocated by configured costing |
| INV-08 | P1 | Same product in two warehouses, units of measure and conversion | Stock availability, Item purchase/sales consumption, Inventory valuation | Base-unit conversion, warehouse split, totals and rounding accurate |
| INV-09 | P2 | Product under request threshold and slow/non-moving product | Product request limit, Slow & non-moving items | Boundary conditions respect configured thresholds and last movement dates |
| TAX-01 | P0 | Taxable sale and purchase with configured VAT rates | Tax center, VAT details, Transaction with code/without VAT, P&L by VAT | Output/input VAT and net liability reconcile to posted tax journal accounts |
| TAX-02 | P1 | Exempt, zero-rated, tax-free, rounding and credit notes | VAT details and Transaction without VAT | Correct classification, base/tax totals and reversal signs |
| FIN-01 | P0 | Posted debit/credit across asset, liability, equity, revenue, expense | Trial balance, Balance sheet, Income statement, Owner equity | Trial balance debits=credits; assets=liabilities+equity per policy; net income reconciles |
| FIN-02 | P0 | Revenue and expense by location, contact, cost center | Income statement, P&L by location/contacts/cost center | Dimension subtotals reconcile to unfiltered P&L; unassigned lines accounted for |
| FIN-03 | P1 | Payment/receipt across period boundary | Cashflow, Balance sheet, A/R/A/P ageing | Cashflow uses payment date, ageing uses as-of/due dates, account closing balances align |
| FIN-04 | P1 | Opening balance and period close | Trial balance, Balance sheet, Income statement, Owner equity | Opening + period movement = closing; retained earnings policy followed |
| RPT-01 | P0 | For each report: filter, refresh, pagination, sort | Every observed report | Filtered rows and all-page totals agree; refresh reflects completed transaction; zero-result state clear |
| RPT-02 | P1 | Export each report with active filters/columns | CSV/Excel/PDF export versus UI | Row IDs, dates, numeric values, signs, source IDs, and total row equal UI; no phantom column/data |
| RPT-03 | P1 | Date ranges, timezone, boundary and multi-currency | Every affected report | Inclusive/exclusive boundaries consistent; report date matches source date; conversion stable |
| RPT-04 | P1 | Drill-down from row to source document and journal | Customer/Supplier transaction, inventory and account statements | Source type, number, party, transaction IDs and account links open correct record |
| RPT-05 | P1 | Role-limited user views Finance | Report and source permissions | Same authorized data and totals; prohibited data not exposed in UI/export |

## Report coverage inventory

The observed Reports menu includes: A/R ageing and detailed, Customer balance, Customer invoice payment, Sales invoice, Customer open sales invoices, Customer income, Customer sales summary, Location sales summary, Customer transaction, VAT details, P&L by location/contacts/cost center/VAT, Detailed and Statement of cost center, Purchase invoice, Cashflow, Slow & non-moving items, Item sales and purchase consumption, Stock availability, Product request limit, Transaction without VAT and with code, Owner equity, Inventory valuation, Supplier transaction, Statement of account/customer/vendor, Location and Supplier purchase summary, Supplier income, Supplier open purchase invoices, Supplier invoice payment, Supplier balance summary, A/P ageing and detailed, Trial balance, Balance sheet, Income statement, and Inventory movement detailed.

## Suggested implementation order

1. Build shared Playwright helpers: authenticated session from an environment-managed secret, test-data factories, report filter/refresh/pagination parser, decimal assertions, source-ID trace, and failure attachments. Never commit credentials.
2. Automate P0 happy paths with a dedicated test company: sales invoice → report → journal → A/R; receipt → balance/cashflow; purchase invoice → A/P → stock; payment → balance/cashflow; journal → trial balance; VAT.
3. Add P1 reversals, returns, dimensions, negative validation, periods, exports, then P2 thresholds. Run read-only report checks in parallel; serialize dependent transaction flows within their own isolated fixtures.
4. Track each result as `Pass`, `Fail` (include source/report values and IDs), `Blocked` (missing fixture/permission/config), or `Not run`. No full-system pass claim until every required workflow has before/after evidence.
