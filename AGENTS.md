# Luxora test workflow

- User confirmation (2026-10-20): Creating Secondary units of measure is still
  required. Do not remove its coverage or accept reverting to Primary on blur.

- User confirmation (2026-10-19): Direct manager was intentionally removed from
  the Contacts filter. Do not require it or report its absence as a bug.

- User confirmation (2026-10-19): Section was intentionally removed from the
  Contacts filter by the developer. Do not require it or report its absence as a bug.

- User confirmation (2026-10-17): Use `Power-vision/automation_test` (remote
  `company`) as the authoritative GitHub repository and daily CI target.
  Personal `BasemMostafaMorsi/OTO-Techs` test workflows are disabled; do not
  reactivate or copy test credentials there without an explicit user request.

- User confirmation (2026-10-14): Apply across all modules: loading/navigation
  timeouts and unavailable controls are execution/automation issues requiring
  investigation, not confirmed functional bugs. Preserve actual test statuses
  and evidence in Allure. Do not hide business assertion mismatches merely
  because another step or screenshot timed out.

- User confirmation (2026-10-12): Payment Voucher visibility after confirmed
  deletion is accepted system behavior, not a bug. Do not require deleted
  vouchers to disappear from the list or reference search. Preserve deletion
  response evidence without asserting disappearance.

- User confirmation (2026-10-07): Projects → Add Country does not require a
  translation action or Arabic-name field. Their absence is correct behavior;
  do not report it as a bug or retain assertions requiring them.

- Organize UI tests by ERP module and screen: for example
  `tests/finance/accounting/journal-entries/` and
  `tests/finance/accounting/journal-items/`. Business Partners screens belong
  under `tests/business-partners/`. Keep shared helpers/fixtures separate and
  update relative imports and documented paths when relocating tests.

- Confirmed journal lifecycle: Draft → Validate → Unposted → Post → Posted →
  Confirm Unpost → Unposted. The user explicitly accepted this behavior; do not
  report the former Draft expectation as an application bug.

- Current user scope (2026-10-04): exclude application report tests, including
  Sales Invoice reports, CSV report exports and Trial Balance checks. Continue
  business workflows without report navigation unless the user changes this
  scope. Allure generation and opening after runs remain required. Select test
  files explicitly; journal-validation.spec.ts currently still includes a Trial
  Balance check and must not be run under this scope.

- Run tests through `npm test -- <Playwright arguments>` (or the existing
  `test:smoke` / `test:headed` scripts) so each run archives old Allure results,
  adds current-run bug reports, generates the report, and opens it automatically.
- After any test run, always include failures in Allure using English fields:
  Title, Module, Type, Severity, Priority, Steps to Reproduce (numbered), Actual Result,
  Expected Result. Use bold field labels, numbered reproduction steps and bullet
  lists for actual/expected results, matching the user's template. Include evidence.
  Preserve readable spacing with Markdown paragraphs and real numbered/bulleted
  lists in Allure's `description` field. Run `scripts/style-allure.cjs` after
  generation (already integrated in npm scripts) to restore bold labels, list
  markers and paragraph spacing overridden by Allure's default CSS.
  Use `npm run report:allure` if tests were
  invoked directly through Playwright instead of the wrapper.
- Describe only observed failures. Do not claim a CSV value mismatch when
  validation stopped at column headers. Keep browser/environment diagnostics
  separate from functional failures and preserve actual test statuses.
- Save browser screenshots inside the project. Do not deploy application changes
  unless the user explicitly requests deployment.

- User confirmation (2026-10-12): Deleting a Currency keeps it visible and sets
  its status to Inactive. Verify the inactive status after reload; do not require
  disappearance or report retained visibility as a bug.
