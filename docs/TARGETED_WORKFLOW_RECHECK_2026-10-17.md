# Targeted business workflow recheck — 2026-10-17

## Verified outcomes

- Contact lifecycle, Customer Governmental/Commercial and Vendor Governmental/Commercial: all five passed in the isolated one-worker run, including request name and persisted preview checks. No current name-save defect reproduced.
- Cost Centers Main cost center, Active and Inactive filters: passed. Same-day filter now selects the persisted test fixture date instead of assuming the Cairo calendar date equals the server date; its targeted rerun passed. This was an automation test-data assumption.
- Journal Items: previous isolated run reconciled 218 UI rows with 218 API rows across 22 pages. API values such as 33.334 require rounding to the two displayed decimals. Corrected comparison uses exact integer arithmetic. After this fix all compared fields matched except 74 account-name cells (e.g. UI 1161005. versus source 1161005. مخزن مكة). Count/amount/name checks are now separate Allure steps.
- Purchase Order conversion: gold product master shows unit جرام. The converted request retains gold and quantity 20, but the unit is empty. Test now compares directly with the source product unit and attaches both values and screenshot. Removed unsupported claims that absent unit proves price/total defects: the product purchase configuration did not define a fixed purchase price.

## Evidence

- Initial 11-test isolated run: artifacts/allure-history/1792099883021/allure-results (8 passed, 3 failed before test corrections).
- Three-test corrected recheck: artifacts/allure-history/1792187518782/allure-results (date passed, Journal account-name mismatch and purchase unit failed).
- Saved product screenshot: artifacts/gold-purchase-source.png.
- Allure preserves original failures and attached screenshots; no historical result was changed to pass.

## Limits

No application source is present in this repository. Missing account names and unit propagation require application fixes; the tests retain the failures. No application deployment was performed. Local changes have not been committed/pushed. A read-only Journal Items verification is being run separately from the full GitHub run to avoid local business-data mutations.
