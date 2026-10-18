# Inventory Additional Items — 2026-10-18

Module: Finance → Inventory → Configuration → Inventory Additional Items.

Suite: `tests/finance/inventory/configuration/additional-items/additional-items.spec.ts`.

```powershell
npm test -- tests/finance/inventory/configuration/additional-items/additional-items.spec.ts
```

## Scenarios

- List names and visible row count compared with API collection.
- Existing name, no-match search, and clear restores source IDs.
- Missing Name, missing Tags, and both missing; validation must prevent POST requests.
- Six Tags options and discarded unsaved name, description and selection.
- Receipts, Deliveries, Internal Transfer, Manufacturing, Scrap and Stocktaking filters, each followed by Reset.
- Cancel filter without applying changes.
- Owned INV-AI-E2E item: create with Receipts, reload, check saved name/description/tag, discard unsaved edit, save changed name/description and add Deliveries, reload, cancel deletion and confirm deletion.

## Evidence and scope

API responses, filter comparisons, screenshot diagnostics and screenshots are attached in Allure. Screenshots and owned-record fixture/cleanup files are saved under `artifacts/finance/inventory/configuration/additional-items/`. Exploratory source is retained outside normal test discovery at `scripts/diagnostics/inventory-additional-items/inspect.ts`.

Existing records are read only; only the newly created test item is edited or deleted. Successful deletion does not assert list disappearance. Accounting Additional Items is a separate screen and suite, even though both screens use `/api/v1.0/additional_items`.

Application reports and exports are excluded. Multi-page navigation, permissions, duplicate/length rules, and using the item inside inventory transactions need additional fixtures or confirmed requirements. A hard lifecycle failure prevents later lifecycle actions from executing; the Pages display assertion is soft so remaining actions execute while preserving the failure.

## Verified result

Latest run: **13 passed, 1 failed**, 3.6 minutes. All six tag filters and Reset passed, as did the saved item's Receipts filter. Name/description/tag persistence, discarded edit, canceled deletion and confirmed deletion completed. The current test item (#16) and the previous interrupted test item (#15) were deleted.

Observed defect: creating with Tags: Receipts saves the mapping, but the Pages column is empty after reload. Editing retains Receipts and the Receipts filter includes the record. Evidence: `inventory-pages-display`, `saved-pages-screen`, `owned-receipts-filter`, source responses and trace. Create uses module ID 51 and the Receipts filter sends 63; because the filter returns the correct item, this identifier difference is not classified as a filtering defect.

Earlier selector timeouts came from differences between create and filter labels (Internal Transfer / Internal transfers, Manufacturing / Manufactures, Scrap / Scrapes, Stocktaking / Stocktakings). They were corrected and the latest run contains no selector/loading failure. Original run evidence remains archived.
