# Product Categories — 2026-10-14

Six distinct cases passed across runs: five non-lifecycle cases in the preceding full run, then the corrected lifecycle case passed in 44.5 seconds. Latest Allure contains the focused lifecycle rerun; prior runs are archived.

Suite: `tests/finance/inventory/inventory-management/product-categories/product-categories.spec.ts`.

## Verified

- Blank submission requires Name and Short code; name alone still requires Short code.
- Unsaved name, code and description are discarded on leaving/reopening creation.
- Cancelling a new special field leaves the category unchanged.
- No-match search returns 0/0; clearing restores visible records.
- Owned category: create, reopen values, discard an unsaved rename, save edited name/code/description, verify persisted fields, deactivate/reactivate with reload checks, select the active category in an unsaved product form, cancel deletion, confirm deletion and retain response/visibility evidence.

## Evidence and interpretation

Screenshots, fixture and cleanup evidence: `artifacts/finance/inventory/inventory-management/product-categories/`. Category dropdown response and lookup screenshot are attached in Allure. Only owned CAT-E2E categories were modified/deleted; no product was saved.

Earlier lookup failures were automation errors: the option's accessible name includes `#<id>`. The category was visibly present. Correcting the exact option locator resolved the failure; no category-lookup application bug is confirmed. Historical failure statuses remain unchanged. Deletion visibility is recorded, not used as an assumed disappearance requirement.

## Remaining

Duplicate/whitespace/length boundaries, editing/removing special fields, their value validation and product-save behavior, export, permissions, Arabic translation and complete pagination reconciliation remain unverified. Existing inline category-creation specs were not rerun. This is not full coverage.

## Custom fields and status-filter follow-up

One additional combined scenario passed in a focused headed rerun (39.3 seconds), bringing the suite to seven distinct passing scenarios across runs.

- Created Text (required), Number (optional) and Date (optional) fields on an owned category; reopened and verified types and required flags.
- Selected the category in an unsaved product and verified all three rendered inputs under Other information. Screenshot `custom-fields-in-product.png` and panel snapshot attached in Allure. No product was saved.
- Deactivated the category and verified persistence after the status response and reload. Inactive included this owned record; Active excluded it; Reset restored it after each filter. Reactivation persisted after reload.
- Deleted the owned category; cleanup response attached. Filtering checks target the owned record, not complete reconciliation of every category across pages.
- Earlier failures were test issues: display labels use title case, and the first status check reloaded before its mutation response. Corrected locator and response waiting resolved them. No functional defect confirmed.
