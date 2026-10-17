# Full-suite failure review — 2026-10-16

Source: artifacts/parallel-run/allure-report and summary.json. 315 tests: 262 passed, 35 failed, 1 broken, 17 skipped. Historical parallel run; this review does not rerun tests or establish current application state.

GitHub currently has no scheduled full-business run visible. Latest successful GitHub runs cover unit/login only. Legacy GitHub full runs lacked injected login credentials and are not reliable business-defect evidence.

## 1. Main cost center matches all pages and Reset

**Area:** finance/helpers/accounting-filters.ts › Finance / Accounting / Cost Centers / Filters › Main cost center matches all pages and Reset

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: Filtered records must exactly match the independent unfiltered baseline predicate

expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 1

  Array [
    "a2fb8e14-6ec3-4e99-a494-03b0a3368508",
    "a2fb8e26-e489-4cee-bf03-7728a04fe6c1",
+   "a2fb8e48-c44d-4577-a2e6-1a9d32f094cc",
  ]
```

## 2. @customer-categories type filter and reset: Governmental

**Area:** business-partners/contact-settings/customer-categories/customer-categories.spec.ts › @customer-categories type filter and reset: Governmental

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 3. cancel and close discard unsaved tax fields

**Area:** finance/accounting/configuration/taxes/taxes.spec.ts › cancel and close discard unsaved tax fields

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('button', { name: 'Create', exact: true })
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Create', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: 'Create', exact: true })
  - Protocol error (Runtime.evaluate): Internal server error, session closed.

```

## 4. Creator matches all pages and Reset

**Area:** finance/helpers/accounting-filters.ts › Finance / Accounting / Accounts / Filters › Creator matches all pages and Reset

**Classification:** Execution / automation issue

**Observed failure:**

```text
"beforeAll" hook timeout of 240000ms exceeded.
```

## 5. decimal total displays 0.3 for 0.1 plus 0.2

**Area:** finance/accounting/receipt-vouchers/receipt-vouchers.spec.ts › decimal total displays 0.3 for 0.1 plus 0.2

**Classification:** Observed functional mismatch

**Observed failure:**

```text
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) })
Expected pattern: /Total\s*0\.3(?:0)?$/
Received string:  "Total0.30000000000000004"
Timeout: 10000ms

Call log:
  - Expect "toHaveText" getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) }) with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) })
    23 × locator resolved to <tr class="MuiTableRow-root mui-1g59brz">…</tr>
       - unexpected value "Total0.30000000000000004"

```

## 6. eye opens selected record

**Area:** business-partners/contact-settings/project-categories/project-categories.spec.ts › eye opens selected record

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 7. @industries cancel edit and delete preserve industry

**Area:** business-partners/contact-settings/industries/industries.spec.ts › @industries cancel edit and delete preserve industry

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 8. @smoke product data is populated in a Purchase Order

**Area:** finance/purchase/material-requests/material-request-to-order.spec.ts › Material Request conversion › @smoke product data is populated in a Purchase Order

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: UOM was not populated

expect(locator).not.toHaveValue(expected) failed

Locator:  locator('input[placeholder="Select Unit"]').first()
Expected: not ""
Received: ""
Timeout:  10000ms

Call log:
  - UOM was not populated locator('input[placeholder="Select Unit"]').first() with timeout 10000ms
  - waiting for locator('input[placeholder="Select Unit"]').first()
    23 × locator resolved to <input value="" id=":r51:" type="text" role="combobox" autocomplete="off" spellcheck="false" aria-invalid="false" aria-expanded="false" autocapitalize="none" aria-autocomplete="list" placeholder="Select Unit" class="MuiInputBase-input MuiInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused mui-1c95x4n"/>
       - unexpected value ""

```

## 9. @customer-categories Individual create edit persist and available on customer form

**Area:** business-partners/contact-settings/customer-categories/customer-categories.spec.ts › @customer-categories Individual create edit persist and available on customer form

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 10. Status filter offers Active and Inactive for bank treasury status

**Area:** finance/accounting/configuration/banks-treasuries/banks-treasuries.spec.ts › Status filter offers Active and Inactive for bank treasury status

**Classification:** Observed functional mismatch

**Observed failure:**

```text
Error: Filter choices should correspond to the active/inactive row status

expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 4

  Array [
-   "Active",
-   "Inactive",
+   "Draft",
+   "Posted",
+   "Canceled",
+   "Unposted",
  ]
```

## 11. @customer-categories type filter and reset: Commercial

**Area:** business-partners/contact-settings/customer-categories/customer-categories.spec.ts › @customer-categories type filter and reset: Commercial

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 12. @regression Area and City remain dependent on their parent address fields

**Area:** user-management/employees/create-employee.spec.ts › User Management - Create Employee › @regression Area and City remain dependent on their parent address fields

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder('Choose country')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByPlaceholder('Choose country') with timeout 10000ms
  - waiting for getByPlaceholder('Choose country')

```

## 13. @classifications status filter and reset: Active

**Area:** business-partners/contact-settings/classifications/classifications.spec.ts › @classifications status filter and reset: Active

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 14. @customer-categories type filter and reset: Individual

**Area:** business-partners/contact-settings/customer-categories/customer-categories.spec.ts › @customer-categories type filter and reset: Individual

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 15. @journal-items complete pagination and displayed fields match loaded API rows

**Area:** finance/accounting/journal-items/journal-items.spec.ts › @journal-items complete pagination and displayed fields match loaded API rows

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: 218
Received: 220

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

## 16. decimal total displays 0.3 for 0.1 plus 0.2

**Area:** finance/accounting/payment-vouchers/payment-vouchers.spec.ts › decimal total displays 0.3 for 0.1 plus 0.2

**Classification:** Observed functional mismatch

**Observed failure:**

```text
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) })
Expected pattern: /Total\s*0\.3(?:0)?$/
Received string:  "Total0.30000000000000004"
Timeout: 10000ms

Call log:
  - Expect "toHaveText" getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) }) with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('cell', { name: 'Total', exact: true }) })
    23 × locator resolved to <tr class="MuiTableRow-root mui-1g59brz">…</tr>
       - unexpected value "Total0.30000000000000004"

```

## 17. Status Active matches all pages and Reset

**Area:** finance/helpers/accounting-filters.ts › Finance / Accounting / Cost Centers / Filters › Status Active matches all pages and Reset

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: Filtered records must exactly match the independent unfiltered baseline predicate

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 0

  Array [
    "a2c76107-c71e-40ca-a8f9-8a23781b9004",
    "a2eec3dc-ced9-4e65-bb95-7c25d96b6e91",
    "a2fb8edd-11a6-4509-bfd5-e5f2121c1928",
-   "a2fb8ef6-72fb-43f4-a991-0f2c918c9026",
  ]
```

## 18. @industries create edit name and description persist after reload

**Area:** business-partners/contact-settings/industries/industries.spec.ts › @industries create edit name and description persist after reload

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 19. @industries deactivate and reactivate persist

**Area:** business-partners/contact-settings/industries/industries.spec.ts › @industries deactivate and reactivate persist

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 20. quantity boundary -1 is invalid on incomplete draft

**Area:** finance/inventory/transfer/internal-transfer/internal-transfer.spec.ts › quantity boundary -1 is invalid on incomplete draft

**Classification:** Test expectation corrected in subsequent work

**Observed failure:**

```text
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first()
Expected: "true"
Received: "false"
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first() with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first()
    23 × locator resolved to <input id=":r3v:" value="-1" type="text" placeholder="0" name="quantity_0" aria-invalid="false" class="MuiInputBase-input MuiFilledInput-input MuiInputBase-inputSizeSmall mui-qegzsr"/>
       - unexpected value "false"

```

## 21. @smoke newly created category appears in the product form

**Area:** finance/inventory/products/product-category.spec.ts › Product categories › @smoke newly created category appears in the product form

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option', { name: 'AUTO Category 14284082' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('option', { name: 'AUTO Category 14284082' }) with timeout 10000ms
  - waiting for getByRole('option', { name: 'AUTO Category 14284082' })

```

## 22. Purchases controls load and dropdown dismissal preserves saved values after reload

**Area:** finance/accounting/configuration/finance-settings/finance-settings.spec.ts › Purchases controls load and dropdown dismissal preserves saved values after reload

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: keyboard.press: Target page, context or browser has been closed
```

## 23. Creation date same day matches all pages and Reset

**Area:** finance/helpers/accounting-filters.ts › Finance / Accounting / Cost Centers / Filters › Creation date same day matches all pages and Reset

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: Positive filter coverage requires matching baseline records

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

## 24. @e2e create, preview, export, edit, filter, and delete a contact

**Area:** business-partners/contacts/contact-lifecycle.spec.ts › Business Partners - Contact lifecycle › @e2e create, preview, export, edit, filter, and delete a contact

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('textbox', { name: 'Name *' })
Expected: "AUTO Contact Updated 11479717"
Received: "AUTO Contact 11479717"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: 'Name *' }) with timeout 10000ms
  - waiting for getByRole('textbox', { name: 'Name *' })
    23 × locator resolved to <input id=":r47:" type="text" name="name" placeholder="Name" aria-invalid="false" value="AUTO Contact 11479717" class="MuiInputBase-input MuiFilledInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedEnd mui-nd1l93"/>
       - unexpected value "AUTO Contact 11479717"

```

## 25. @classifications create edit name and description persist after reload

**Area:** business-partners/contact-settings/classifications/classifications.spec.ts › @classifications create edit name and description persist after reload

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 26. @smoke required employee sections and fields are available

**Area:** user-management/employees/create-employee.spec.ts › User Management - Create Employee › @smoke required employee sections and fields are available

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: expect(locator).toBeVisible() failed

Locator: getByRole('combobox', { name: 'User type *' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('combobox', { name: 'User type *' }) with timeout 10000ms
  - waiting for getByRole('combobox', { name: 'User type *' })

```

## 27. confirmed status persists across reload

**Area:** business-partners/contact-settings/project-categories/project-categories.spec.ts › confirmed status persists across reload

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 28. @customers Governmental create, preview, edit and delete

**Area:** business-partners/customers/customers.spec.ts › @customers Governmental create, preview, edit and delete

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: "CUST-E2E-Governmental-1792011710859-EDITED"
Received: "CUST-E2E-Governmental-1792011710859"
```

## 29. @regression newly created Arabic category is selected and remains available

**Area:** finance/inventory/products/product-category-ar.spec.ts › Product categories - Arabic › @regression newly created Arabic category is selected and remains available

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option', { name: 'فئة آلية 14264717' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('option', { name: 'فئة آلية 14264717' }) with timeout 10000ms
  - waiting for getByRole('option', { name: 'فئة آلية 14264717' })

```

## 30. @e2e create, preview, update, and export an employee

**Area:** user-management/employees/employee-lifecycle.spec.ts › User Management - Employee lifecycle › @e2e create, preview, update, and export an employee

**Classification:** Execution / automation issue

**Observed failure:**

```text
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('combobox', { name: 'User type *' })

```

## 31. tree exposes owned record and hierarchy

**Area:** finance/helpers/master-data.ts › Finance / Accounting / Accounts › tree exposes owned record and hierarchy

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: page.waitForResponse: Target page, context or browser has been closed
```

## 32. @vendors Commercial create, preview, edit and delete

**Area:** business-partners/vendors/vendors.spec.ts › @vendors Commercial create, preview, edit and delete

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: "VEND-E2E-Commercial-1792011806445-EDITED"
Received: "VEND-E2E-Commercial-1792011806445"
```

## 33. cancel status preserves Active

**Area:** business-partners/contact-settings/project-categories/project-categories.spec.ts › cancel status preserves Active

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 34. @industries status filter and reset: Active

**Area:** business-partners/contact-settings/industries/industries.spec.ts › @industries status filter and reset: Active

**Classification:** Execution / automation issue

**Observed failure:**

```text
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

## 35. Status Inactive matches all pages and Reset

**Area:** finance/helpers/accounting-filters.ts › Finance / Accounting / Cost Centers / Filters › Status Inactive matches all pages and Reset

**Classification:** Needs isolated verification / data investigation

**Observed failure:**

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: 5
Received: 4
```

## 36. quantity boundary 0 is invalid on incomplete draft

**Area:** finance/inventory/transfer/internal-transfer/internal-transfer.spec.ts › quantity boundary 0 is invalid on incomplete draft

**Classification:** Test expectation corrected in subsequent work

**Observed failure:**

```text
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first()
Expected: "true"
Received: "false"
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first() with timeout 10000ms
  - waiting for getByRole('row').filter({ has: getByRole('combobox', { name: 'Choose product', exact: true }) }).first().getByRole('textbox').first()
    23 × locator resolved to <input value="0" id=":r3v:" type="text" placeholder="0" name="quantity_0" aria-invalid="false" class="MuiInputBase-input MuiFilledInput-input MuiInputBase-inputSizeSmall mui-qegzsr"/>
       - unexpected value "false"

```

## Review conclusions

- Needs isolated verification / data investigation: 9
- Execution / automation issue: 22
- Observed functional mismatch: 3
- Test expectation corrected in subsequent work: 2

- Voucher decimal totals display 0.30000000000000004 instead of 0.3 (two screens).
- Banks/Treasuries status options differ from Active/Inactive row status.
- Cost Center and Journal Items baseline differences may be affected by concurrent writes; do not classify as confirmed defects without an isolated rerun.
- Contact/customer/vendor edited-name checks failed; verify actual request payload and persistence before assigning cause.
- Purchase-order unit remained empty; investigate source data and conversion.
- Cost Center date test had zero matching baseline records: coverage precondition/data issue.
- Internal Transfer 0/-1 tests wrongly required aria-invalid. Subsequent tests validate server HTTP 422 and passed; see docs/INTERNAL_TRANSFERS_COVERAGE_2026-10-14.md.
- Protocol response-body failures, unavailable controls, closed browsers and setup timeouts are execution issues, not confirmed application defects.

Original Allure statuses and evidence are unchanged.
