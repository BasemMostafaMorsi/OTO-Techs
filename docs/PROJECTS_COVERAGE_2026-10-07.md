# Projects coverage — 2026-10-07

Scope: Business Partners → Projects. No application report tests.

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/projects/projects.spec.ts tests/business-partners/projects/country-modal.spec.ts
```

Previous full execution: **10 passed, 1 failed, 11 total (2.9 minutes)**.
The user confirmed that the translation expectation was incorrect: no translation
action or Arabic-name field is required. That finding is withdrawn; historical
test statuses remain unchanged. All saved test-owned projects were deleted.
The corrected dialog test checks labels, input and cancellation. Focused rerun:
**1 passed (11.9 seconds)**. The other ten tests passed in the previous full run;
the full suite was not rerun for this isolated correction.
See [the withdrawn finding](PROJECTS_BUG_REPORT_2026-10-07.md).

## Automated coverage

| Scenario | Checks |
| --- | --- |
| Required fields | Name, Customer and Service Center errors; no project create request. |
| Lifecycle | Create linked to Basem #8 and Master Service Center #1; search; open eye action; edit name/description; reload; delete. |
| Field persistence | Unique reference, description, Egypt/Cairo/Nasr City, address and landmark survive reopening. |
| Delete cancellation | Cancel keeps the project; confirmed cleanup removes it. |
| Address dependencies | Area/City disabled initially; country selection and changing country clear dependent selections. |
| List integrity | All available pages loaded; unique project IDs match loaded API pages. |
| Search/download | Empty search, reset, successful nonempty list download. |
| Customer filter | Basem rows only; Reset restores the complete baseline rows. |
| Service Center filter | Master Service Center rows only; Reset restores baseline. |
| Optimize | Hide and restore Ref column, restoring the original setting in cleanup. |
| Add Country dialog | Title, Country Name, Submit, entering an unsaved name and Cancel without selecting it. Translation is not required. |

## Observations

- The initial run had 8 passes and 3 failures. Two filter failures were automation timing issues: baseline count was read as 0 before data loaded. Waiting for the list response and visible loaded total fixed the baseline; both filters and full row restoration passed in the final run.
- Absence of an Add Country translation action is correct behavior, explicitly confirmed by the user on 2026-10-07.
- The eye action opens `/en/contacts/projects/edit/<id>` and permits editing. This is recorded as current behavior, not classified as a defect without a confirmed read-only requirement.
- Unlike the Customer/Vendor address behavior observed earlier, the Projects country-change test cleared Area/City successfully in the initial run.
- Division offered no selectable options during inspection; selection/persistence remains untested.
- Browser HTTP/console diagnostics are separate from functional failures in Allure.

## Evidence and cleanup

Screenshots: `artifacts/business-partners/projects/` and per-test `test-results/`.
Create/update evidence, list ID reconciliation and downloads are attached to Allure.
Only unique `PROJ-E2E-*` projects are mutated and deleted in `finally`, after capturing screenshots.
Manual inspection project #17 was deleted successfully.

## Limits

This extends Projects from one dialog test to broad core-screen coverage;
it does not claim every project workflow is covered. Merge, representative
assignment, Division selection/filtering, customer reassignment, permissions,
localization across the whole screen, boundary/invalid-format tests, concurrent
updates and linked financial/CRM transactions remain outside this run.
The current baseline contains only four projects, so multi-page behavior has
not been exercised with a larger dataset. Download content parity is untested.
