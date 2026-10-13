# Accounts and Cost Centers coverage

Updated: 2026-10-11. Execution evidence began 2026-10-08.

## Verified scenarios

Each screen has 14 automated scenarios:

1. Required fields block empty submission.
2. Create, edit name/notes and reopen persisted number/hierarchy.
3. Cancel creation.
4. Cancel edit and deletion.
5. Eye action opens the selected record.
6. Menu Preview opens the selected record.
7. Deactivate/reactivate with reload verification.
8. Active filter and reset on the owned searched record.
9. Inactive filter and reset on the owned searched record.
10. Tree exposes the owned record; Expand/Collapse controls exercised.
11. Empty search, reset and nonempty list download.
12. Duplicate number rejection preserves the original.
13. Dependent validation: financial-statement guidance for Accounts; main center for Secondary Cost Centers.
14. Image attachment persists after save/reopen and decodes successfully.

Accounts: 11 core scenarios passed in one run; three additional scenarios passed in focused runs. Cost Centers: 13 scenarios passed in one run; the attachment scenario passed separately. These are 14 passing scenarios per screen across runs, not a single 28-test run.

## Files and evidence

- tests/finance/accounting/accounts/accounts.spec.ts
- tests/finance/accounting/cost-centers/cost-centers.spec.ts
- Shared implementation: tests/finance/helpers/master-data.ts
- Screenshots: artifacts/finance/accounting/accounts and artifacts/finance/accounting/cost-centers
- Allure contains screenshots, saved-response evidence, downloads and browser diagnostics. Historical runs remain under artifacts/allure-history.
- Suite names now distinguish Accounts from Cost Centers despite the shared implementation. Failure enrichment also reads suite/titlePath labels to select the correct module.

## Test data

Only unique ACC-E2E accounts and CC-E2E Secondary centers are edited/deleted. Owned record deletion is verified in cleanup. Four accounts left by the initial interrupted automation run were explicitly deleted successfully.

A reusable Primary Cost Center remains intentionally: CC-E2E-INSPECT-20261008, number 987654, ID a2eec3dc-ced9-4e65-bb95-7c25d96b6e91. It was created for these tests. The observed UI exposes no edit/delete actions for Primary centers and disables their status toggle; this is not classified as an application defect. Secondary fixtures use this parent. Do not modify unrelated centers.

## Follow-up filter coverage

The later [accounting filter coverage](ACCOUNTING_FILTERS_COVERAGE_2026-10-11.md) supersedes the filter, tag, currency/type and pagination gaps below for its explicitly listed scenarios. Other limitations remain applicable.

## Findings and limitations

No confirmed functional defect in the completed scenarios. Early failures were automation problems: reading stale responses across navigation and assuming Cost Centers automatically suggest a number like Accounts. Fixed before successful reruns; original statuses remain archived.

Observed copy issue: an empty Cost Center name shows "Account name is required". Submission is correctly blocked; wording alone does not imply a validation failure.

Coverage is not exhaustive. Not verified: role/permission matrices, concurrency, full 324-account pagination reconciliation, tags, alternative currencies/types, every filter (creator/date/parent/tags/hide-zero), Optimize persistence, file-type/size rejection, attachment deletion, financial posting integration, primary-center modification rules, or exported value reconciliation. Preview opens an editable form; no read-only assumption is imposed. Application Reports remain excluded by user instruction.
