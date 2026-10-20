**Title:** [Units of Measure] A displayed Primary type is rejected as missing on submit

**Module:** Finance → Inventory → Configuration → Units of Measure  
**Type:** Functional / Required-field validation  
**Severity:** High  
**Priority:** High

**Steps to Reproduce:**

1. Open **Units of Measure** and click **Create**.
2. Verify that **Unit type** displays **Primary**.
3. Enter a unique unit name and unit code.
4. Click **Submit**.

**Actual Result:**

- The form displays **Unit type is required**, while the type field displays **Primary**.
- The test does not observe the expected creation response.

**Expected Result:**

- The displayed selected type satisfies required-field validation.
- A valid unit name, code and type can be submitted.

**Evidence:**

- Allure: `unit-type-validation`, screenshot and trace.
- Test: `create edit cancel status reload and confirmed delete lifecycle`.

The test now surfaces the observed validation message instead of reporting only a response timeout. It does not select a different business type to make creation pass.
