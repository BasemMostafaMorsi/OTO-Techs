# Business Partners and Finance run review

Command: `npm test -- tests/contacts tests/finance`

Result: **16 tests: 12 passed, 4 failed**. Allure generated with current-run failure descriptions and browser diagnostics; screenshots are attached and saved under `artifacts/finance` and `artifacts/business-partners`.

## Passed

- Contact attachment file-type restrictions.
- Contact create, preview, export, edit, filter and delete lifecycle. The earlier edit persistence failure did not reproduce in this run.
- Saved notes and uploaded attachments persist after reload; test contacts cleaned up.
- Payment terms dropdown scroll isolation.
- Five CSV/decimal utility checks.
- ACC-02: unbalanced journal rejected, no finance write request, Trial Balance grand totals unchanged.
- Complete Trial Balance arithmetic.

## Failures and limits

1. Both Sales Invoice CSV exports fail because column names are empty or duplicated. Validation stops at headers; this run does not establish exported value differences.
2. Source invoice reconciliation stops at its all-rows guard: 10 rows were read, but the expected `10/10` counter was absent. This is an automation coverage limitation requiring verified pagination support, not evidence of incorrect invoice totals.
3. Customer-filter comparison observes invoice #8 OPEN BALANCE change from 5520.00 to 2070.00. The test fails on exact row equality. Whether OPEN BALANCE is intentionally filter-dependent or affected by changing shared data requires investigation; it is not yet a confirmed accounting defect.

These results cover the existing selected tests only, not all Business Partners or Finance workflows. Browser/environment diagnostics remain separate from functional outcomes. No application deployment was performed.

## Follow-up: four Sales Invoice tests rerun

All four remain failed. The source-list pagination limitation was corrected and browser-verified: all 12 unique source invoices now load. The report contains 13 invoice IDs, including #3, which is absent from the complete source list. This is an observed scope discrepancy; deletion/status inclusion rules have not been established. Row-value reconciliation stops at this ID mismatch.

The customer filter again changes invoice #8 OPEN BALANCE from 5520.00 to 2070.00. Baseline, expected and filtered rows are now attached as `filter-comparison`. A soft assertion preserves the failure while allowing refresh/reset checks to execute. The accounting meaning of this column under filters still needs confirmation.

Both CSV variants still stop at malformed headers. Allure was regenerated/opened, and fresh browser screenshots were saved inside the project.

## Follow-up: compare common invoice values

The invoice-ID assertion now remains a failure but allows matching invoices to be checked. The latest four-test rerun still fails in all four cases. For all 12 common invoices, customer, total, outstanding amount and payment status assertions pass; the source reconciliation failure is the extra report ID #3. This narrows the observed issue to record inclusion, without asserting its cause.

Allure now uses separate reproduction steps and classifications for reconciliation, filtering and export failures. The OPEN BALANCE comparison is explicitly untriaged pending confirmation of filter-dependent balance semantics. Screenshots were refreshed by the browser run.
