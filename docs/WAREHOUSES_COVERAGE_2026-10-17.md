# Warehouses coverage — 2026-10-17

Module: Finance → Inventory → Configuration → Warehouses.

Test file: `tests/finance/inventory/configuration/warehouses/warehouses.spec.ts`.

## Scenarios

- List count, names, countries, areas, cities and active status against source data.
- Name search, no-match search and clearing.
- Active / Inactive filters and Reset.
- Country, Country + Area, and Country + Area + City filters.
- Warehouse keeper filter.
- Closing filters without submitting.
- Required fields on an empty Create form.
- Dependent address clearing after changing Country.
- Creation and persisted field values for a unique WH-E2E warehouse.

## Execution notes

Initial run was interrupted after navigation/response timeouts. These are execution issues, not confirmed product defects. The list loader now waits for DOM readiness and the data response concurrently, with a bounded 60-second response timeout.

A subsequent attempt exhausted Node memory before producing test results. Old agent-created browser sessions were closed and the rerun uses lightweight artifacts (screenshots and traces).

During manual inspection, a list document request returned HTTP 500, but the application recovered and the existing warehouse edit form loaded successfully. No edit failure is inferred from that response alone. Firebase notification permission diagnostics are kept separate from business assertions.

Screenshots: `artifacts/finance/inventory/configuration/warehouses/`.

## Scope limits

The initial fixture had three active warehouses on one page. Inactive filtering initially covers an empty result. Pagination beyond one page, exports and application reports are not covered. No existing operational warehouse is changed. Test creation may automatically create an inventory account; created WH-E2E records are identifiable and retained for follow-up.

## Results

The latest run was stopped because drive C ran out of space (ENOSPC). Three results were written: one passed (list reconciliation), two failed (the search test counted the empty-state placeholder row; the Active filter encountered disk exhaustion). These are not confirmed functional defects. The row locator is corrected, but the correction has not yet been rerun. The remaining nine scenarios did not complete; creation was not reached and no WH-E2E warehouse was created in these runs.

Disk exhaustion also interrupted a source-file write. The complete warehouse test source was recovered from its Playwright trace and the row-locator fix reapplied. Free disk space before running the suite again. The run is incomplete and no full warehouse coverage claim is made.
