# Project Categories coverage — 2026-10-08

Run: 9 tests; 8 passed, 1 failed. Executed headed through npm test.
Suite: tests/business-partners/contact-settings/project-categories/project-categories.spec.ts

Passed: required-name validation; create/edit name and description persistence; eye and menu Preview open the selected record; cancel create; cancel edit/delete; cancel status; list search/reset and nonempty download. Confirmed deletion in cleanup passed for all created records.

Failure: confirming Active ? Inactive sends name:null and receives HTTP 400, "The name field is required." The status dialog stays open. Reverse activation and status persistence cannot be verified because this first transition fails.

Evidence: Allure request/response attachment, before-cleanup screenshot and trace. Screenshots also saved under artifacts/business-partners/contact-settings/project-categories.

Limits: no permissions, duplicate-name policy, concurrency, large-volume pagination, project-form integration or exported content reconciliation covered. Preview opens an editable dialog; this behavior is recorded without asserting a defect. Application Reports excluded.

## Retest — 2026-10-08

Status transitions passed in a focused slow-user run, with persistence checked after reload. Original eight passes plus this focused pass cover all nine scenarios across runs, not a single clean full run. Fast interaction remains timing-sensitive; the status helper waits for the detail response and deliberately allows five seconds for dialog initialization. General status-change bug wording is withdrawn; early-interaction behavior remains a separate investigation item.
