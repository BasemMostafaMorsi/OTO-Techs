# Accounts filter defects — 2026-10-11

Two defects reproduced in three focused tests. No application Reports were tested.

**Title:** [Accounts] Cash flow filter includes accounts outside the selected category

**Module:** Finance → Accounting → Accounts
**Type:** Functional / Filtering
**Severity:** Medium
**Priority:** Medium

**Steps to Reproduce:**

1. Open Finance → Accounting → Accounts.
2. Open Filter.
3. Select Cash flow: Operating Activities.
4. Submit and inspect the returned accounts.

**Actual Result:**

- Selected Operating Activities; the response contains 7 nonmatching accounts on the first page.
- The filtered total is 324.
- See cashflow-comparison for the exact returned names and categories.

**Expected Result:**

- Return only accounts belonging to the selected Cash flow category.

**Evidence:**

- Review the attached comparison JSON and browser screenshots.

---

**Title:** [Accounts] Cash flow filter includes accounts outside the selected category

**Module:** Finance → Accounting → Accounts
**Type:** Functional / Filtering
**Severity:** Medium
**Priority:** Medium

**Steps to Reproduce:**

1. Open Finance → Accounting → Accounts.
2. Open Filter.
3. Select Cash flow: Investing Activities.
4. Submit and inspect the returned accounts.

**Actual Result:**

- Selected Investing Activities; the response contains 10 nonmatching accounts on the first page.
- The filtered total is 324.
- See cashflow-comparison for the exact returned names and categories.

**Expected Result:**

- Return only accounts belonging to the selected Cash flow category.

**Evidence:**

- Review the attached comparison JSON and browser screenshots.

---

**Title:** [Accounts] Hide zero values removes a negative nonzero balance

**Module:** Finance → Accounting → Accounts
**Type:** Functional / Filtering
**Severity:** Medium
**Priority:** Medium

**Steps to Reproduce:**

1. Open Finance → Accounting → Accounts.
2. Search for Main treasury and note its balance (-4139.400).
3. Open Filter and enable Hide zero values.
4. Submit and inspect the search result.

**Actual Result:**

- Main treasury, with balance -4139.400, disappears after enabling Hide zero values.
- Filtered response contains 0 records.

**Expected Result:**

- Exclude only zero balances; retain accounts with positive or negative nonzero balances.

**Evidence:**

- Review the attached comparison JSON and browser screenshots.
