# Units of Measure

Test file: `tests/finance/inventory/configuration/units-of-measure/units-of-measure.spec.ts`.

Diagnostic source retained outside test discovery: `scripts/diagnostics/units-of-measure/inspect-submit.ts`. Unit type behavior is covered by the main suite; the old inspection source is retained for reference.

Run only this screen:

```powershell
npm test -- tests/finance/inventory/configuration/units-of-measure/units-of-measure.spec.ts
```

| Area       | Automated scenarios                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List       | Visible record count, names, unit codes and active switches compared with API source                                                                                                                        |
| Search     | Existing name, no match, clear restores records                                                                                                                                                             |
| Selection  | Individual row, select all, clear selection without changing record values                                                                                                                                  |
| Validation | Blank submission; missing name, unit type or unit code                                                                                                                                                      |
| Unit type  | Explicit Primary selection; Secondary reveals parent/rate fields, defaults rate to 1 and requires a primary unit; switching to Primary hides conversion controls                                            |
| Navigation | Unsaved creation fields discarded after leaving and reopening                                                                                                                                               |
| Filters    | Active, Inactive, Reset, cancel without applying, search/status intersection                                                                                                                                |
| Lifecycle  | Create unique test unit; reload name/code; open edit and check prefilled values; discard edit; save edited name/code; deactivate and reactivate with reload verification; cancel deletion; confirm deletion |
| Evidence   | API attachments, screenshots inside project, browser diagnostics and styled Allure report                                                                                                                   |

Lifecycle actions use only the newly created test unit. Existing units are read or selected, never edited or deleted. Deletion success does not assume disappearance from the list.

Coverage limits: application reports/exports are excluded by project instructions. Multi-page navigation requires enough source records; current list comparison covers the returned page. Duplicate rules, maximum lengths, successful secondary-unit conversion workflows and permissions need confirmed requirements and dedicated fixtures before asserting behavior. A hard lifecycle failure prevents later steps from executing; the edit-type assertion is soft so the remaining workflow runs while preserving the failure.

Last verified: 2026-10-18. Screen suite: 14 passed, 1 failed. A separate temporary cleanup test passed and removed the two test-owned records left by interrupted discovery runs. The final Allure run therefore contains 15 passed and 1 failed result.

Observed defect: a unit created and listed as Primary opens in Edit with Unit type set to Secondary. Evidence: `edit-unit-type` JSON, `edit-unit-type-screen`, and trace. The test explicitly reselects Primary after recording this failure; subsequent edit persistence, both status changes with reload, canceled deletion and confirmed deletion all completed successfully. The test-created unit was deleted successfully.
