# Classifications coverage — 2026-10-07

Scope: Business Partners → Contact Settings → Classifications.

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/contact-settings/classifications/classifications.spec.ts
```

Final clean execution: **9 passed, 1 failed, 10 total (3.3 minutes)**.
The export request returned HTTP 404 with `Class not found`; no file downloaded.
List reconciliation and search/reset assertions passed before export failed.
See [the export bug report](CLASSIFICATIONS_BUG_REPORT_2026-10-07.md).

An earlier mixed result directory included a response-body/navigation error in
the Inactive test. Initial list responses are now restricted to the unfiltered
first page and parsed immediately; both status filters passed in the clean run.
Historical results were archived by the standard wrapper, not relabeled.

## Scenarios

1. Required name prevents submission and displays validation.
2. Create classification, reopen, edit name/description and verify persistence.
3. Saved classification is selectable on Customers → Create.
4. Saved classification is selectable on Vendors → Create.
5. Cancel creation leaves no matching saved classification.
6. Cancel editing preserves the original name; cancel deletion preserves the record.
7. Deactivate and reactivate, verifying each state after reload.
8. Active filter checks all loaded switches; Reset restores original rows.
9. Inactive filter checks all loaded switches; Reset restores original rows.
10. All loaded IDs reconcile with API pages, no duplicate IDs, empty search/reset and nonempty successful list download.

## Evidence and cleanup

- Screenshots: `artifacts/business-partners/contact-settings/classifications/` and per-test attachments.
- Create/update requests and responses, list IDs and downloaded files are attached to Allure.
- Only unique `CLASS-E2E-*` classifications are edited, toggled and deleted. Cleanup captures the screen first.
- All test-owned records from the final run were deleted. Leftover classification #16, `CLASS-E2E-FILTER-1791377292601`, was also verified by ID/name and deleted successfully before the clean run.
- Customer/Vendor integration selects classifications on unsaved forms; no customer/vendor records are created.
- Browser HTTP/console diagnostics remain separate from functional outcomes.

## Limits

Coverage does not establish duplicate-name policy, whitespace/length boundaries,
bulk actions, role permissions, localization, linked-record deletion restrictions,
concurrent updates or persisted customer/vendor linkage. Downloads are checked
for success and nonempty content, not content parity. The existing baseline has
two classifications, so larger multi-page datasets are not exercised. Export
content parity is blocked by the 404 response. Application
Reports are excluded.
