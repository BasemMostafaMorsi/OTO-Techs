# Finance CI review and corrections

Original run: https://github.com/Power-vision/automation_test/actions/runs/39385287001

Updated: 2026-10-21. The original 29 failed tests were investigated using the CI log, downloaded artifacts, headed browser inspection and targeted reruns. These were not 29 separate application bugs.

| Area | Original failures | Latest verified outcome |
| --- | ---: | --- |
| Taxes | 2 | Passed. Search the owned record after reload; preserve the primary error if cleanup fails. |
| Products & Services filters | 6 | Passed. Collect every source page, account for eager UI loading, and use current category labels with IDs. |
| Units of Measure list/search/selection/filters | 6 | Passed. Match business code and name instead of confusing the displayed translation ID with the unit ID. |
| Additional Items tags | 4 | Passed. Updated obsolete option labels. Receipts and Deliveries also passed as regression checks. |
| Payment / Receipt Vouchers totals | 2 | Passed. Compare displayed totals numerically; preserve checks after changing and deleting lines. |
| Product Categories Arabic / English | 2 | Passed. Load paginated dropdown options; typing does not search this API. |
| Internal Transfer / Scrap / Stocktaking warehouse filters | 3 | Passed. Match warehouse name plus its displayed ID. |
| Units of Measure Secondary selection | 1 | Still failed: Secondary reverts to Primary after blur. Required functionality confirmed by the user. See BUG_UOM_SECONDARY_2026-10-20.md. |
| Units of Measure creation/lifecycle | 1 | Still failed: Primary is displayed but Submit reports Unit type is required. No creation response; later lifecycle steps remain blocked. See BUG_UOM_PRIMARY_2026-10-20.md. |
| Journal Items account names | 1 | Previously reported to developer; unchanged and not rerun in this correction scope. |
| Scrap historical balance | 1 | Previously reported to developer; unchanged and not rerun in this correction scope. |

**Result:** 25 of the original failures now pass across the targeted verification runs. Two unit-type scenarios expose application behavior requiring developer investigation. The two previously escalated bugs remain outside this rerun scope. No failed status was converted to passed or skipped.

**Latest run:** 12 tests, 10 passed and 2 failed (the unit-type cases). Earlier targeted runs verified Taxes, Additional Items, the six unit list/filter scenarios, and all three warehouse-filter workflows. This is not a fresh full Finance run.

**Evidence:**

- `artifacts/finance-fix-run.log`
- `artifacts/finance-fix-recheck.log`
- `artifacts/finance-fix-final.log`
- `allure-results/` and `allure-report/` contain the latest run; prior runs are archived under `artifacts/allure-history/`.
- Screenshots are retained inside the project and attached to Allure. The headed Secondary reproduction is `artifacts/finance/inventory/configuration/units-of-measure/secondary-selection-review.png`.

Tests and reporting were changed locally. No application deployment or GitHub push was performed. Existing user edits in playwright.config.ts and the receipt-voucher evidence handling were preserved.
