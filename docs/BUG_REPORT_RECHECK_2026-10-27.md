# Rechecked application issues — 27 October 2026

Scope: targeted browser verification following personal CI run 40361672652. Automation failures are tracked separately below; they are not application defects.

Historical targeted-run summary before the Year field correction: **19 passed, 4 failed, 2 skipped**. Employee lifecycle passed after the approved Preview expectation update (artifacts/employee-preview-approved.log). Historical failures included Employee Preview, which the user accepted as correct behavior on 27 October. It is withdrawn as a bug; raw historical results remain unchanged. Remaining issues after user confirmations: two Taxes cases and Scrap. Save all is no longer classified as a bug. Two unchanged-save cases require an already configured financial year; they are explicitly skipped while it is empty. Successful-save coverage is therefore incomplete for those two cases. This is a combined review, not a full-suite rerun.

Automation corrections verified: balance columns resolved by header, Vouchers fully loaded from API selection counts, inventory date expectations read from settings, Manufacturing validation scoped to price fields, Receipts pricing temporarily shown and original settings restored, product searched before Purchase Order conversion, removed employee fields no longer required, and Primary explicitly selected for UOM creation.

---

Finance Settings correction (27 October): the user confirmed the recently added Year field must be completed before Save / Save all. The previous missing-year case is withdrawn as an application bug. Updated tests select the configured year, or the current Cairo year if unset, and verify persistence and preservation of other settings. Both Financial settlement Save and Save all passed on recheck; year 2026 was saved. Evidence: artifacts/financial-year-save.log and current Allure screenshots.

---

**Title:** [Taxes] Creation requires a translated name that is not available in the creation dialog

**Module:** Finance → Accounting → Configuration → Taxes  
**Type:** Functional / Validation  
**Severity:** High  
**Priority:** High

**Steps to Reproduce:**

1. Open Taxes and click Create.
2. Enter Tax name, Short Key and Description.
3. Select Sales or Purchases, select the corresponding Tax class and enter rate 12.5.
4. Submit the dialog.

**Actual Result:**

- Both Sales and Purchases creation attempts are rejected with `The tax_translates.1.name field is required.`
- The inspected dialog exposes one Tax name field and no additional translated-name input or translation action.
- Creation fails before edit/status/delete can be exercised.

**Expected Result:**

- A user can create a tax after completing the fields provided by the dialog.
- If another translation is mandatory, the UI provides the field and validates it before submission.

**Evidence:** `artifacts/ci-followup-recheck.log`; project screenshots under `artifacts/finance/accounting/configuration/taxes/`; original Allure outcomes and attachments archived under `artifacts/allure-history/`. Reproduced in both lifecycle tests on 27 October.

---

**Title:** [Scrap] Balance Before displays current warehouse stock instead of the saved historical value

**Module:** Inventory → Transfer → Scrap  
**Type:** Data consistency / Requirements review  
**Severity:** Untriaged  
**Priority:** High for requirements review

**Steps to Reproduce:**

1. Open the completed Scrap record #2.
2. Inspect the gold product's Balance Before.
3. Compare it with `scrape_items[0].balance_before` and the warehouse stock in the same detail response.

**Actual Result:**

- Saved `balance_before` is 190.00.
- UI Balance Before is 310.
- The current stock for warehouse #3 in the same response is also 310.

**Expected Result:**

- If Balance Before represents historical stock before the transaction, it must reflect the saved value.
- If current stock is intended, the display semantics and test expectation require explicit confirmation.

**Evidence:** Live detail response and `artifacts/scrap-balance-2026-10-27.png`. This is the previously reported discrepancy, not a newly discovered defect. No numeric constant is hard-coded in the test comparison.
