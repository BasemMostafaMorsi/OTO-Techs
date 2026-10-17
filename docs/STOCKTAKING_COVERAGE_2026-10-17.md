# Stocktaking coverage — 2026-10-17

Scope: Finance → Inventory → Transfer → Stocktaking.

Full screen run: **13 tests: 12 passed, 1 failed**. Targeted date-filter rerun reproduced the same failure; Reset then successfully restored the baseline records. This is one unique defect, not two.

## Covered

- List fields and row count compared with source records.
- Reference search, no-match search and clearing.
- All six status choices and Reset.
- Warehouse filter and combined Warehouse + Completed filter.
- Closing Filter without submitting.
- Same-day date range and Reset.
- Completed surplus and shortage details: reference, warehouse, disabled date/warehouse, product, book balance, actual balance and signed difference.
- Difference arithmetic: actual balance minus book balance.

## Observed defect

**Title:** [Stocktaking] Same-day date filter excludes an existing record

**Module:** Finance → Inventory → Transfer → Stocktaking  
**Type:** Functional / Date filtering  
**Severity:** Medium  
**Priority:** Medium

**Steps to Reproduce:**

1. Open Stocktaking and identify record #2, reference 22511, dated 2026-10-07.
2. Open Filter.
3. Select 2026-10-07 as both the start and end date.
4. Submit the filter.
5. Reset the filter.

**Actual Result:**

- Both request dates correctly contain 2026-10-07, but the response and UI contain no records.
- The unfiltered baseline contains record #2 dated 2026-10-07 23:20:30.
- Reset restores the records. The failure reproduced on the targeted rerun.
- The exact backend cause has not been established.

**Expected Result:**

- Filtering by a complete calendar day includes records dated on that day.
- Reset restores the unfiltered list.

**Evidence:**

- Allure attachment `stocktaking-date-filter` contains the baseline, selected date, request URL and filtered response.
- Allure includes screenshots, video and trace.
- Project screenshots: `artifacts/finance/inventory/transfer/stocktaking/`.
- The latest Allure report contains the targeted rerun; the 13-test run is archived under `artifacts/allure-history/`.

## Limits

Only two existing Completed records were available. Other status tests covered empty results and Reset, not positive records for those statuses. Pagination beyond one page was not exercised. No Create action was visible. Creation, editing, deletion, approval, posting and stock movements were not tested; existing completed records were not changed. Application reports remain excluded.
