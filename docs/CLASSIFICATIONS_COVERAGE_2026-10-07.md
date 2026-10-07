# Classifications coverage — 2026-10-07

Scope: Business Partners → Contact Settings → Classifications.

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/contact-settings/classifications/classifications.spec.ts
```

Execution: pending, 10 tests.

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
- Customer/Vendor integration selects classifications on unsaved forms; no customer/vendor records are created.
- Browser HTTP/console diagnostics remain separate from functional outcomes.

## Limits

Coverage does not establish duplicate-name policy, whitespace/length boundaries,
bulk actions, role permissions, localization, linked-record deletion restrictions,
concurrent updates or persisted customer/vendor linkage. Downloads are checked
for success and nonempty content, not content parity. The existing baseline has
two classifications, so larger multi-page datasets are not exercised. Application
Reports are excluded.
