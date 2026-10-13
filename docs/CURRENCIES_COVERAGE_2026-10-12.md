# Currencies coverage — 2026-10-12

Location: Finance → Accounting → Configurations → Currencies.
Suite: tests/finance/accounting/configuration/currencies/currencies.spec.ts.

Six standalone tests passed: name required, symbol required, short key required, cancel/close creation discards fields, default currency is active with disabled status and no mutation controls, no-match search and clearing restores count.

The focused owned-currency lifecycle successfully created and reopened values, canceled edits without changing saved data, saved edited name/symbol/code, verified inactive and active after reload, searched for the exact record, canceled deletion, and received HTTP 200 on confirmed deletion. Its final disappearance assertion failed: the record remained visible after reloading. This is an unresolved requirement, not a confirmed product defect: the user accepted continued visibility for Payment Vouchers, but has not yet explicitly clarified Currencies. Keep historical test status failed; do not claim all seven tests passed.

The earlier lifecycle attempt reused XTS and received 'The code has already been taken.' This is a test-data collision, not a product defect. The fixture now uses independently generated three-letter codes. Deleted codes may remain reserved.

Screenshots and fixture/cleanup ledgers: artifacts/finance/accounting/configuration/currencies/. Allure includes screenshots and failure details, with browser/environment diagnostics separate. Original SAR/EGP and default settings were not modified. Owned exploration and lifecycle records received DELETE requests but may remain visible under the observed deletion behavior.

Limitations: no full permission matrix, duplicate-name policy, length/Unicode boundaries, integrations, exchange rates, or default-currency changes were tested. No application Reports were opened.

## Confirmed requirement and rerun

User confirmed on 2026-10-12: deletion retains the Currency and changes its status to Inactive. The disappearance assertion was replaced with visible-row and unchecked-status assertions after reloading. Focused lifecycle rerun passed (25.0 seconds). All seven scenarios now pass across the initial six passing cases and corrected lifecycle rerun; this is cumulative coverage, not a fresh combined seven-test run. The earlier failure was an incorrect expectation, not a product defect. Screenshots and Allure were regenerated and the report opened.
