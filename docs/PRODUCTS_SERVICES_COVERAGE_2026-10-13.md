# Products & Services — initial coverage

Final headed run: **7 passed**, 1.3 minutes.

Suite: `tests/finance/inventory/inventory-management/products-services/products-services.spec.ts`.

## Covered

1. Blank form requires name and unit.
2. Type choices include Product and Service; Service can be selected.
3. Sales price, sell/purchase flags, purchase description and name persist when switching tabs.
4. Inventory fields and Other information tab load.
5. Leaving the unsaved creation form discards its name.
6. No-match search returns 0/0; clearing restores list count.
7. Create an owned PS-E2E Service with unit وحدة and required purchase account Petty Cash; reload list, search and verify Service type. No opening stock or transactions entered.

## Evidence and fixture

Screenshots and `service-fixture.json` are under `artifacts/finance/inventory/inventory-management/products-services/`; responses/screenshots are attached in Allure. The created service is retained for subsequent edit/status/delete coverage; its exact name and API data are recorded in the fixture ledger. Existing products were not edited.

Initial run: 4 passed, 3 failed due to test assumptions. Sales Price becomes Sales Price * after enabling sales; search needed initial list response completion; Service requires an account in Purchase information. Corrected run passed all seven. No functional bug confirmed; diagnostics remain separate.

## Remaining

Product creation, edit/reopen field verification, activation/deactivation, deletion, filters, category integration, tax/discount calculations, image upload, numeric boundaries, opening inventory, warehouse effects, permissions and transaction integration are not covered here. Existing category tests were not rerun. This is not complete module coverage.
