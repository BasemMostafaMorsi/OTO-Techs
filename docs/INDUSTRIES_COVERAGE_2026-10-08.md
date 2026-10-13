# Industries coverage — 2026-10-08

Suite: tests/business-partners/contact-settings/industries/industries.spec.ts

Eight scenarios passed across runs, not a single clean eight-test run:

- Required name blocks submission.
- Create and edit name/description persist after reopening.
- Cancel creation leaves no saved record.
- Cancel edit and delete preserve the record.
- Deactivate and reactivate persist after reload.
- Active filter and reset.
- Inactive filter and reset.
- UI IDs reconcile with loaded API IDs; empty search, reset and nonempty list download succeed.

Confirmed deletion ran in cleanup for each saved IND-E2E record. Screenshots are under artifacts/business-partners/contact-settings/industries; Allure includes evidence and browser diagnostics.

Initial run: five passed, three automation failures. Fixed API matching to exclude frontend requests, then fixed ID extraction to avoid concatenating the adjacent creation date. Filter rerun: two passed. Final list/download rerun: one passed. No confirmed functional application defect remains from these scenarios. Archived failed results retain their original statuses.

Not covered: permissions, duplicate-name policy, concurrency, large-volume pagination, saved Customer/Vendor linkage and downloaded content reconciliation. Customer form did not expose an exact Industry combobox during exploratory inspection; no integration defect asserted. Application Reports excluded.
