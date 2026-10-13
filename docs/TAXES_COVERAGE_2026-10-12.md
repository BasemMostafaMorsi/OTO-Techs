# Taxes coverage — 2026-10-12

Final complete run: 6 passed (1.1 minutes). No confirmed functional defect in these scenarios.

Location: Finance → Accounting → Configurations → Taxes.
Suite: tests/finance/accounting/configuration/taxes/taxes.spec.ts.

Covered: required name/short key/dependency; cancel and close discard unsaved fields; switching Sales/Purchases clears incompatible class in both directions; no-match search and clearing restores list; separate Sales and Purchases lifecycles with matching classes, create rate 12.5, reopen fields, cancel edit, save edited name/rate 7.25/description, reload, inactive/active persistence, cancel deletion and successful confirmed deletion response.

Only unique TAX-E2E fixtures were changed. Existing taxes were not edited. DELETE cleanup responses and screenshots are in artifacts/finance/accounting/configuration/taxes. Post-delete observations: [{"id":3,"visible":0,"active":null},{"id":4,"visible":0,"active":null}]. Visibility after deletion is recorded without imposing a disappearance requirement.

The first run had 3 passes and 3 failures while form settings loaded and input values reset. Waiting for finance settings and tax classes before editing resolved all three; no application bug is established by those initial failures. Historical results remain archived. Allure generated and opened after runs; browser diagnostics are separate from functional statuses.

Limitations: initial settings coverage, not complete tax calculation/compliance coverage. Not tested: zero/negative/over-100 bounds, duplicate policy, non-VAT saving, tax-class maintenance, invoice calculation/rounding, posting effects, permissions or concurrency. No application Reports were used and no financial transaction was posted.
