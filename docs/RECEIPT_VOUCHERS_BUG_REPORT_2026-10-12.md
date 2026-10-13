# Receipt Vouchers bug report — 2026-10-12

**Title:** [Receipt Vouchers] Decimal total displays floating-point digits

**Module:** Finance → Accounting → Receipt Vouchers
**Type:** UI / Numeric formatting
**Severity:** Low
**Priority:** Low

**Steps to Reproduce:**

1. Open Finance → Accounting → Receipt Vouchers → Create.
2. Enter 0.1 in the first line Value.
3. Click New to add a second line and enter 0.2.
4. Inspect Total value and the table total.

**Actual Result:**

- The total is displayed as 0.30000000000000004 instead of a currency-formatted 0.3.
- This observation concerns display precision; posting impact was not tested.

**Expected Result:**

- Display the sum with appropriate decimal formatting (0.3 or 0.30), without floating-point artifacts.

**Evidence:**

- See attached decimal-total JSON and browser screenshots.
