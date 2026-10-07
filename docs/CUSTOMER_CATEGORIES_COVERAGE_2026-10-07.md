# Customer Categories coverage — 2026-10-07

Scope: Business Partners → Contact Settings → Customer Categories.

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/contact-settings/customer-categories/customer-categories.spec.ts
```

Execution: 13 scenarios implemented and exercised. Initial full run: **11 passed,
2 failed**. The two failures came from immediate `setChecked`/`uncheck` checks
before the server-backed status update completed. Replaced these actions with a
click followed by an awaited state assertion and reload verification.

Focused rerun: **3 passed (1.2 minutes)** — activation lifecycle plus both status
filters. All 13 scenarios have passing evidence across these runs; this is not
a claim of a single 13/13 final run. Latest Allure contains the focused three-test
run; the initial run remains archived under `artifacts/allure-history/`.
No functional application defect was confirmed. HTTP/console diagnostics remain
attached separately. All saved test-owned categories were removed successfully.

## Implemented scenarios

| Area | Verification |
| --- | --- |
| Required fields | Empty Name and Type display errors and send no category-create request. |
| Individual / Governmental / Commercial | Three lifecycle tests: create, reload, edit name/description, reopen and verify saved type/values. |
| Customer integration | Each lifecycle selects its saved category in the matching customer-type form; no customer is saved. |
| Cancel create | Unsaved category does not appear in search. |
| Cancel edit/delete | Original name persists; canceling deletion preserves the category. |
| Activation | Deactivation and reactivation survive reload. |
| Type filters | Three tests create a matching fixture, inspect all filtered rows and reset to the baseline count. |
| Status filters | Active and Inactive tests create matching fixtures and verify all displayed status switches. |
| List/search/export | Loaded IDs reconcile with API pages, no duplicate IDs, empty search/reset, nonempty successful list download. |

## Evidence and data handling

- Screenshots: `artifacts/business-partners/contact-settings/customer-categories/` and per-test attachments.
- Create/update request evidence and list IDs are attached to Allure.
- Only `CAT-E2E-*` fixtures are edited, toggled or deleted; cleanup captures the screen before removal.
- Manually inspected category #5 was deleted successfully.
- Browser diagnostics remain separate from functional results.

## Limits

The baseline has two categories, so large-data pagination has not been exercised.
Duplicate-name rules, maximum lengths, whitespace-only names, role permissions,
bulk actions, localization, type changes on categories already linked to saved
customers, deletion of linked categories, concurrent updates and export content
parity are not covered. Customer integration checks selection without saving a
customer, so persisted customer/category linkage is not established by this run.
No application Reports module is opened.
