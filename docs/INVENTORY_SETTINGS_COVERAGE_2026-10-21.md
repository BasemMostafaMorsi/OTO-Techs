# Inventory Settings — 2026-10-21

Scope: Finance → Inventory → Configuration → Inventory Settings.

Final verification: **15 passed, 0 failed**. Original company option values were restored and checked after each save test. Screenshots are saved under `artifacts/finance/inventory/configuration/inventory-settings/` and attached to Allure.

| Coverage | Tabs | Cases |
| --- | --- | ---: |
| Change checkboxes, save, reload, verify, restore original values | Receipts, Deliveries, Internal transfer, Manufacturing, Scrap, Stocktaking | 6 |
| Discard unsaved option changes; reject empty special-field form; cancel entered field name and verify unchanged table | All six tabs | 6 |
| Avg. Cost / Sales Price mutual exclusion and persistence, followed by restoration | Deliveries, Internal transfer, Scrap | 3 |

Earlier attempts encountered local disk exhaustion and loading delays. Test fixes align table text comparison and wait for initial Receipts data before selecting another tab. Price-mode persistence is checked separately because changing the mode resets dependent Change prices state. These earlier failures are not confirmed application bugs; their results remain archived.

## Extended verification

An additional targeted run passed **7/7 tests**: six special-field lifecycle cases and one Receipt-form settings integration case. Together with the earlier 15 passing cases, 22 scenarios have passed across the two verification runs (not a single combined run).

- Special-field lifecycle on all six tabs: Text, Number and Date creation (two tabs per type), save/reload, cancelled rename, persisted rename and required status, discarded deletion, saved deletion, and cleanup of owned records only. Existing field types are protected from editing; the test checks the preserved type instead of trying to reselect it.
- Receipt integration: saved Hide prices on platform controls the Unit price column; saved Change created date controls whether the date can be edited. Both states were verified in an unsaved Receipt form and original options restored.
- Screenshots and save responses are attached to Allure. The latest report contains the seven extended cases; previous runs remain archived.

No confirmed functional bug was observed in these final covered scenarios. Printed output, special-field input behavior on transfer forms, and settings integration on the other five transfer forms are not yet verified.

Run only this file through the standard npm test wrapper. The final run used one worker and `--trace off` to reduce disk use while retaining screenshots. CI finance/full-business discovery includes the new test file automatically.
