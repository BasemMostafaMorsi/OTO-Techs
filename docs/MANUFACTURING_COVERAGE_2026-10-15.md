# Manufacturing — 2026-10-15

Final headed run: **7 passed, 1 failed**, 1.8 minutes. Tests: tests/finance/inventory/transfer/manufacturing/manufacturing.spec.ts.

## Covered

- Initial date, fields, source/output/Scrap rows and Save actions.
- Empty draft validation: warehouses, products, quantities and output/Scrap prices; no create request sent.
- Independent add/remove lines in all three sections.
- Disabling Scrap removes its inputs and validation requirements; enabling it restores its table.
- Discard unsaved reference, batch, notes and extra lines.
- Empty search and clear restore the list.
- Readonly source/output balances match product stock details. Changing source clears its product; output stays selected. Reselecting the source product displays the new warehouse balance.
- Create a uniquely identified Draft without Scrap, reopen product/quantity/reference/batch/notes, cancel deletion and reload.
- Attempt notes-only update: fails as described below. Test-owned draft cleanup succeeds and reference search returns 0/0.

## Confirmed failure

**Title:** [Manufacturing] Saving a notes-only draft edit fails because product names are submitted as null

**Module:** Finance → Inventory → Transfer → Manufacturing  
**Type:** Functional / Draft editing  
**Severity:** High  
**Priority:** High

**Steps to Reproduce:**

1. Create a draft with gold from Riyadh and potat into Makkah, quantity 1 and Scrap disabled.
2. Save as Draft and reopen Edit.
3. Confirm both product names are visible.
4. Change only Notes.
5. Choose Save → Save as Draft.

**Actual Result:**

- PUT returns HTTP 422.
- Submitted source and output product_name fields are null.
- Server requires from_manufacture_items.0.product_name and to_manufacture_items.0.product_name.
- Changed notes are not saved. Reproduced manually and in both automated runs.

**Expected Result:**

- A notes-only edit preserves existing product details and saves without product reselection.

**Evidence:**

- Allure manufacturing-update JSON and manufacturing-update-screen screenshot; original failure status retained.
- Test screenshots and trace in test-results/ and allure-results/; earlier attempts archived under artifacts/allure-history/.
- Manual screenshot: artifacts/finance/inventory/transfer/manufacturing/manual-edit-rejected.png.
- Final log: artifacts/finance/inventory/transfer/manufacturing/verified-run.log.

## Corrections and remaining scope

The first run assumed source product selection survives a warehouse change. The observed UI clears that selection, so the test now reselects the product before checking its balance. This was an automation assumption, not a confirmed application bug.

Not yet covered: Validate/approval/completion, inventory movement and costing reconciliation, saving a draft with Scrap enabled, quantity boundaries, attachments, terms, filters, permissions and pagination. A manually entered output price differed after reload; its costing rules and request values need separate verification, so no price bug is confirmed here. No manufacture was validated or completed.
