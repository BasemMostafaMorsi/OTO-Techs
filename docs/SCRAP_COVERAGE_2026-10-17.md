# Scrap coverage — 2026-10-17

Path: tests/finance/inventory/transfer/scrap/scrap.spec.ts

12 distinct scenarios exercised: 10 passed, 2 failed. First run: 10 passed / 1 failed; focused date/detail run: 2 failed. Original Allure results are archived separately; latest report contains the focused run.

Passed: list row count/fields versus API, batch search/no-result/reset, six status filters/reset, warehouse and combined Completed filter, closing an unsaved filter.

## Observed failures

**Title:** [Scrap] Balance before differs from the saved scrap item

**Module:** Finance → Inventory → Transfer → Scrap
**Type:** Functional / Historical balance display
**Severity:** Medium
**Priority:** Medium

**Steps to Reproduce:**

1. Open Scrap list.
2. Open Completed record #2.
3. Inspect the gold item Balance before.
4. Compare with the attached detail response scrape_items.balance_before.

**Actual Result:**

- UI shows 300; persisted balance_before is 190.
- Product and quantity match the record. No incorrect stock posting is established.

**Expected Result:**

- Balance before reflects the saved pre-transaction balance.

**Title:** [Scrap] Same-day date filter excludes records on the selected day

**Module:** Finance → Inventory → Transfer → Scrap
**Type:** Functional / Filtering
**Severity:** Medium
**Priority:** Medium

**Steps to Reproduce:**

1. Observe records #1 and #2 dated 17/09/2026.
2. Open Filter and set Date range to 17/09/2026 through 17/09/2026.
3. Close the calendar and Submit.
4. Inspect results and the attached query parameters.

**Actual Result:**

- start_date=2026-09-17 and end_date=2026-09-17 return no records.
- Unfiltered source dates are 2026-09-17 18:04:12 and 2026-09-17 18:05:34.

**Expected Result:**

- The inclusive same-day range includes both records dated that day.

## Evidence and limits

- Latest Allure attachments: scrap-detail-source, scrap-date-filter, scrap-screen, failure traces.
- Screenshots: artifacts/finance/inventory/transfer/scrap/.
- First run archived at artifacts/allure-history/1792220351512/allure-results/.
- Only two existing Completed records were available. Missing statuses exercised empty-result paths, not positive fixtures. Baseline explicitly requires one page; multi-page coverage is not claimed.
- No Create button was visible. Creation, modification, deletion, approval, completion, stock movements, export, permissions and attachment persistence are not covered. No completed record was modified or deleted.
- Scope covers Scrap workflow, not application financial reports. Changes remain local.
