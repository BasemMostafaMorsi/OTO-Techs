**Title:** [Project Categories] Changing status fails because the request omits the saved name

**Module:** Business Partners ? Contact Settings ? Project Categories  
**Type:** Functional / Status change  
**Severity:** Medium  
**Priority:** Medium

**Steps to Reproduce:**

1. Open Business Partners ? Contact Settings ? Project Categories.
2. Create an Active category with a valid name.
3. Open the category action menu and select Status.
4. Select Inactive and click Change.
5. Inspect the request response and dialog.

**Actual Result:**

- PUT /api/v1.0/sales/categories/44 sends name:null and is_active:"0".
- The server returns HTTP 400: "The name field is required."
- The status dialog stays open and the transition cannot complete.

**Expected Result:**

- The existing category status should change successfully.
- Its saved name and other values should be preserved.
- The confirmed status should persist after reload.

**Evidence:**

- Current Allure run: status-change test, JSON request/response attachment, trace and before-cleanup screenshot.
- Eight other scenarios passed; all owned test records were deleted.

## Retest correction — 2026-10-08

The original claim of a generally broken status action is withdrawn. A deliberate slow-user run passed both Active ? Inactive and Inactive ? Active, including persistence after reload. Fast execution reproduced the original HTTP 400; awaiting only the detail response was also insufficient for stable form initialization. This is a timing-sensitive observation requiring separate investigation, not proof that normal manual status changes fail. The regression now explicitly allows five seconds for dialog initialization; this delay must not be interpreted as resolving the application's early-interaction behavior.
