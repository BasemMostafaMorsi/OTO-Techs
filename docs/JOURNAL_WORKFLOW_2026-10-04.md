# Journal workflow — 2026-10-04

Current scope excludes all application reports at the user's request. Allure remains the test-results viewer.

Corrected rerun: **1 passed** (35.7 seconds). Draft → Unposted → Posted →
Unposted and persisted reference, description and amounts all passed. Screenshots
were refreshed inside the project and Allure regenerated. The former bug is closed
as an incorrect test expectation; historical run statuses remain unchanged.

Implemented `tests/finance/accounting/journal-entries/journal-posting.spec.ts` with a unique numeric reference, two cash accounts and SAR 0.10 on each side.

- Draft creation and reopening passed.
- Validate changes Draft to Unposted; it is not the Post operation.
- Post changes the entry to Posted, confirmed after reload.
- Unpost requires the Confirm Unpost dialog.
- User clarification: Unpost → Unposted is correct and is not a bug. The former Draft expectation and bug classification are withdrawn. The test now expects Unposted and does not assert the dialog's Draft wording.

Earlier investigation evidence: journal #75, reference `1791131985310`, ID `a2e70acf-22c2-48a5-bfae-8d475734a128`. It is retained as Unposted. Current screenshots: `artifacts/finance/journal-posted.png` and `journal-posting-final.png`; the latest run's own journal identity and API responses are attached in Allure.

Earlier failures caused by missing workflow steps and report-loading selectors are automation issues. Report checks were subsequently removed from this workflow. Earlier exploratory test entries were retained; do not assume that every historical test entry has been deleted or unposted.

ACC-01/03 have UI workflow coverage; ACC-04 covers Unpost → Unposted. The earlier failed run reflects an incorrect test expectation, not an application defect. Cancellation, reversal journals and individual-account reconciliation are not established by this check.
