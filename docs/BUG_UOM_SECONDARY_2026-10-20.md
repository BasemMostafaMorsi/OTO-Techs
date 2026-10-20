**Title:** [Units of Measure] Secondary selection reverts to Primary after leaving the field

**Module:** Finance → Inventory → Configuration → Units of Measure  
**Type:** Functional / Unit type selection  
**Severity:** High  
**Priority:** High

**Steps to Reproduce:**

1. Open **Units of Measure** and click **Create**.
2. Open **Unit type** and select **Secondary**.
3. Move focus to **Name**, or press Tab.
4. Inspect **Unit type** and the dependent fields.

**Actual Result:**

- Unit type reverts to **Primary**.
- The secondary-unit workflow cannot proceed through its expected primary-unit and conversion controls.
- Reproduced in a headed browser and in the targeted Playwright run. The assertion expected `Secondary` and received `Primary`.

**Expected Result:**

- **Secondary** remains selected after leaving the field.
- The user can configure and create a secondary unit.

**Evidence:**

- Screenshot: `artifacts/finance/inventory/configuration/units-of-measure/secondary-selection-review.png`
- Allure attachment: `secondary-type-after-blur`, with screenshot and trace.
- Test: `tests/finance/inventory/configuration/units-of-measure/units-of-measure.spec.ts`

The user confirmed on 2026-10-20 that creating Secondary units is still required. No stock-posting or arithmetic defect is inferred from this form failure.
