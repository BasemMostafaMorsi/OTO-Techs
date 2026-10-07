# Withdrawn finding — Projects Add Country

**Status:** Not a bug — user-confirmed behavior (2026-10-07).

The previous report incorrectly required a translation action and Arabic country-name
field. The user confirmed these are not required. That expectation and the
known-issue annotation have been removed from the test.

The corrected test verifies Add Country, Country Name, Submit, unsaved text entry
and Cancel. Historical failures describe an incorrect test expectation, not an
application defect; their recorded statuses are preserved in archived runs.

Current screenshot: `artifacts/business-partners/projects/add-country-accepted-behavior.png`.
Browser diagnostics remain separate from functional results.
