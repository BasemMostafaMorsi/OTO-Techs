// Scenario requirements from Finance_Automation_Coverage_Luxora.md; not execution results.
export const financeScenarios = [
    {
        "id":  "ACC-01",
        "priority":  "P0",
        "action":  "Post balanced manual journal, two accounts",
        "reports":  "Journal entries/items → Trial balance, Statement of account, Balance sheet or Income statement",
        "oracle":  "One journal ID; debit=credit; each account movement matches; statement changes by classified account"
    },
    {
        "id":  "ACC-02",
        "priority":  "P0",
        "action":  "Attempt unbalanced journal",
        "reports":  "Journal entries/items, Trial balance",
        "oracle":  "Validation rejects posting; no new report movement"
    },
    {
        "id":  "ACC-03",
        "priority":  "P1",
        "action":  "Draft then post journal",
        "reports":  "Journal items, Trial balance",
        "oracle":  "Draft excluded from posted totals; one movement after posting only"
    },
    {
        "id":  "ACC-04",
        "priority":  "P1",
        "action":  "Reverse/cancel posted journal",
        "reports":  "Journal items, account statement, Trial balance",
        "oracle":  "Reversal entry offsets original once; audit trail preserved"
    },
    {
        "id":  "ACC-05",
        "priority":  "P1",
        "action":  "Post journal assigned to cost center and location",
        "reports":  "Detailed/Statement of cost center, P\u0026L by cost center/location",
        "oracle":  "Amount appears only in chosen dimensions; grand total reconciles to ledger"
    },
    {
        "id":  "ACC-06",
        "priority":  "P1",
        "action":  "Journal with foreign currency and exchange rate",
        "reports":  "Statement of account, Trial balance, Balance sheet",
        "oracle":  "Currency and base amounts use configured rate and rounding; balance remains zero"
    },
    {
        "id":  "ACC-07",
        "priority":  "P0",
        "action":  "Create payment voucher against supplier payable",
        "reports":  "Payment vouchers → Supplier invoice payment, Supplier open purchase invoices, A/P ageing, Cashflow, Statement of vendor",
        "oracle":  "Paid rises, outstanding falls, bank/cash falls, no duplicate payment"
    },
    {
        "id":  "ACC-08",
        "priority":  "P0",
        "action":  "Create receipt voucher against customer receivable",
        "reports":  "Receipt vouchers → Customer invoice payment, Customer open sales invoices, A/R ageing, Cashflow, Statement of customer",
        "oracle":  "Paid rises, outstanding falls, bank/cash rises, payment linked to invoice"
    },
    {
        "id":  "ACC-09",
        "priority":  "P1",
        "action":  "Partial, over, and duplicate voucher payment",
        "reports":  "Invoice payment, ageing, account statement",
        "oracle":  "Partial balance exact; overpayment follows configured policy; duplicate rejected or posted distinctly per policy"
    },
    {
        "id":  "ACC-10",
        "priority":  "P1",
        "action":  "Payment/receipt across two banks or treasuries",
        "reports":  "Cashflow, Statement of account, Balance sheet",
        "oracle":  "Correct bank only and account balance matches voucher"
    },
    {
        "id":  "ACC-11",
        "priority":  "P1",
        "action":  "Close accounting period, attempt backdated posting",
        "reports":  "Journal, all relevant reports",
        "oracle":  "Closed-period rule enforced; no unauthorized historical delta"
    },
    {
        "id":  "SAL-01",
        "priority":  "P0",
        "action":  "Quotation → order → credit sales invoice",
        "reports":  "Sales Invoice, Customer transaction, Customer balance, A/R ageing detailed/open invoices, Trial balance",
        "oracle":  "Quote/order do not post unless policy says so; invoice posts once; exact invoice total and receivable"
    },
    {
        "id":  "SAL-02",
        "priority":  "P0",
        "action":  "Cash sales invoice and generated receipt",
        "reports":  "Sales Invoice, Customer invoice payment, Cashflow, Statement of customer, Trial balance",
        "oracle":  "Paid status, zero outstanding, receipt link, cash and revenue/tax postings reconcile"
    },
    {
        "id":  "SAL-03",
        "priority":  "P0",
        "action":  "Partial payment, then settle invoice",
        "reports":  "Customer invoice payment, Customer open sales invoices, A/R ageing, Customer balance",
        "oracle":  "Outstanding = invoice total − sum applied receipts; status transitions once"
    },
    {
        "id":  "SAL-04",
        "priority":  "P0",
        "action":  "Sales return / credit note with linked original invoice",
        "reports":  "Sales summary, Customer transaction, A/R ageing, VAT details, stock movement",
        "oracle":  "Revenue/receivable/tax reverse by return value; stock increases when physical return completed"
    },
    {
        "id":  "SAL-05",
        "priority":  "P1",
        "action":  "Sales invoice with discount, extra charge, VAT and two lines",
        "reports":  "Sales Invoice, VAT details, Transaction with/without VAT, P\u0026L",
        "oracle":  "Subtotal ± adjustments + tax = invoice total; report totals match source and journal"
    },
    {
        "id":  "SAL-06",
        "priority":  "P1",
        "action":  "Sales by two locations, representatives, customers",
        "reports":  "Location sales summary, Customer sales summary/income, P\u0026L by location/contacts",
        "oracle":  "Correct grouping and grand total; no cross-location leakage"
    },
    {
        "id":  "SAL-07",
        "priority":  "P1",
        "action":  "Invoice due today and past due at bucket boundaries",
        "reports":  "A/R ageing and detailed, Customer open sales invoices",
        "oracle":  "Each unpaid amount appears in exactly one ageing bucket based on due date and as-of date"
    },
    {
        "id":  "SAL-08",
        "priority":  "P1",
        "action":  "Cancel draft versus completed sales invoice",
        "reports":  "Sales Invoice, customer statements, Trial balance",
        "oracle":  "Draft excluded; cancellation/reversal follows status policy without orphan entries"
    },
    {
        "id":  "PUR-01",
        "priority":  "P0",
        "action":  "Material request → RFQ → PO → credit purchase invoice",
        "reports":  "Purchase Invoice, Supplier transaction, Supplier balance, A/P ageing/open invoices, Trial balance",
        "oracle":  "Pre-invoice steps follow posting policy; invoice payable, expense/inventory, tax post exactly once"
    },
    {
        "id":  "PUR-02",
        "priority":  "P0",
        "action":  "Cash purchase invoice and payment voucher",
        "reports":  "Supplier invoice payment, Cashflow, Statement of vendor, Trial balance",
        "oracle":  "Zero outstanding, voucher link and bank movement equal paid amount"
    },
    {
        "id":  "PUR-03",
        "priority":  "P0",
        "action":  "Partial supplier payment and settlement",
        "reports":  "Supplier open purchase invoices, A/P ageing detailed, Supplier balance summary",
        "oracle":  "Remaining = invoice − applied payments; due bucket and status update"
    },
    {
        "id":  "PUR-04",
        "priority":  "P0",
        "action":  "Purchase return linked to invoice",
        "reports":  "Purchase Invoice, Supplier transaction, A/P ageing, VAT details, Inventory movement",
        "oracle":  "Payable/tax/cost/stock reverse as appropriate and original linkage visible"
    },
    {
        "id":  "PUR-05",
        "priority":  "P1",
        "action":  "Two suppliers/locations and mixed VAT rates",
        "reports":  "Supplier purchase summary/income, Location purchase summary, VAT details",
        "oracle":  "Grouped totals and tax rates match invoice lines and consolidated total"
    },
    {
        "id":  "PUR-06",
        "priority":  "P1",
        "action":  "Reject duplicate supplier invoice reference or invalid total",
        "reports":  "Purchase Invoice, Supplier transaction",
        "oracle":  "No second posting or report row for rejected attempt"
    },
    {
        "id":  "INV-01",
        "priority":  "P0",
        "action":  "Purchase invoice creates receipt; complete receipt",
        "reports":  "Receipts, Stock availability, Inventory movement detailed, Inventory valuation",
        "oracle":  "Warehouse quantity rises by accepted quantity; inventory value rises by configured cost"
    },
    {
        "id":  "INV-02",
        "priority":  "P0",
        "action":  "Sales invoice creates delivery; complete delivery",
        "reports":  "Deliveries, Stock availability, Item sales consumption, Inventory valuation, P\u0026L",
        "oracle":  "Quantity falls once; cost of goods recognized per valuation policy"
    },
    {
        "id":  "INV-03",
        "priority":  "P0",
        "action":  "Internal transfer A → B",
        "reports":  "Inventory movement detailed, Stock availability, Inventory valuation",
        "oracle":  "A −q, B +q, company total quantity/value unchanged subject to transfer costs"
    },
    {
        "id":  "INV-04",
        "priority":  "P1",
        "action":  "Manual receipt and delivery with unique reference",
        "reports":  "Inventory movement detailed, Stock availability, Inventory valuation",
        "oracle":  "Correct source/receipt/delivery IDs, quantity and cost in reports"
    },
    {
        "id":  "INV-05",
        "priority":  "P1",
        "action":  "Scrap quantity",
        "reports":  "Inventory movement detailed, Stock availability, Inventory valuation, P\u0026L",
        "oracle":  "Quantity/value decreases and configured loss account changes"
    },
    {
        "id":  "INV-06",
        "priority":  "P1",
        "action":  "Stocktaking variance, positive and negative",
        "reports":  "Inventory movement detailed, Stock availability, Inventory valuation",
        "oracle":  "System quantity adjusts to count; variance and journal reconcile"
    },
    {
        "id":  "INV-07",
        "priority":  "P1",
        "action":  "Manufacturing consumes components and receives finished item",
        "reports":  "Inventory movement detailed, Stock availability, Inventory valuation",
        "oracle":  "BOM quantities and value conserved/allocated by configured costing"
    },
    {
        "id":  "INV-08",
        "priority":  "P1",
        "action":  "Same product in two warehouses, units of measure and conversion",
        "reports":  "Stock availability, Item purchase/sales consumption, Inventory valuation",
        "oracle":  "Base-unit conversion, warehouse split, totals and rounding accurate"
    },
    {
        "id":  "INV-09",
        "priority":  "P2",
        "action":  "Product under request threshold and slow/non-moving product",
        "reports":  "Product request limit, Slow \u0026 non-moving items",
        "oracle":  "Boundary conditions respect configured thresholds and last movement dates"
    },
    {
        "id":  "TAX-01",
        "priority":  "P0",
        "action":  "Taxable sale and purchase with configured VAT rates",
        "reports":  "Tax center, VAT details, Transaction with code/without VAT, P\u0026L by VAT",
        "oracle":  "Output/input VAT and net liability reconcile to posted tax journal accounts"
    },
    {
        "id":  "TAX-02",
        "priority":  "P1",
        "action":  "Exempt, zero-rated, tax-free, rounding and credit notes",
        "reports":  "VAT details and Transaction without VAT",
        "oracle":  "Correct classification, base/tax totals and reversal signs"
    },
    {
        "id":  "FIN-01",
        "priority":  "P0",
        "action":  "Posted debit/credit across asset, liability, equity, revenue, expense",
        "reports":  "Trial balance, Balance sheet, Income statement, Owner equity",
        "oracle":  "Trial balance debits=credits; assets=liabilities+equity per policy; net income reconciles"
    },
    {
        "id":  "FIN-02",
        "priority":  "P0",
        "action":  "Revenue and expense by location, contact, cost center",
        "reports":  "Income statement, P\u0026L by location/contacts/cost center",
        "oracle":  "Dimension subtotals reconcile to unfiltered P\u0026L; unassigned lines accounted for"
    },
    {
        "id":  "FIN-03",
        "priority":  "P1",
        "action":  "Payment/receipt across period boundary",
        "reports":  "Cashflow, Balance sheet, A/R/A/P ageing",
        "oracle":  "Cashflow uses payment date, ageing uses as-of/due dates, account closing balances align"
    },
    {
        "id":  "FIN-04",
        "priority":  "P1",
        "action":  "Opening balance and period close",
        "reports":  "Trial balance, Balance sheet, Income statement, Owner equity",
        "oracle":  "Opening + period movement = closing; retained earnings policy followed"
    },
    {
        "id":  "RPT-01",
        "priority":  "P0",
        "action":  "For each report: filter, refresh, pagination, sort",
        "reports":  "Every observed report",
        "oracle":  "Filtered rows and all-page totals agree; refresh reflects completed transaction; zero-result state clear"
    },
    {
        "id":  "RPT-02",
        "priority":  "P1",
        "action":  "Export each report with active filters/columns",
        "reports":  "CSV/Excel/PDF export versus UI",
        "oracle":  "Row IDs, dates, numeric values, signs, source IDs, and total row equal UI; no phantom column/data"
    },
    {
        "id":  "RPT-03",
        "priority":  "P1",
        "action":  "Date ranges, timezone, boundary and multi-currency",
        "reports":  "Every affected report",
        "oracle":  "Inclusive/exclusive boundaries consistent; report date matches source date; conversion stable"
    },
    {
        "id":  "RPT-04",
        "priority":  "P1",
        "action":  "Drill-down from row to source document and journal",
        "reports":  "Customer/Supplier transaction, inventory and account statements",
        "oracle":  "Source type, number, party, transaction IDs and account links open correct record"
    },
    {
        "id":  "RPT-05",
        "priority":  "P1",
        "action":  "Role-limited user views Finance",
        "reports":  "Report and source permissions",
        "oracle":  "Same authorized data and totals; prohibited data not exposed in UI/export"
    }
] as const;
