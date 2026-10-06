# Customers coverage — 2026-10-06

Scope: Business Partners → Customers, on the configured Luxora test company.
Application Reports are excluded. Customer list download is a list action,
not navigation to the Reports module.

## Execution

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/customers/customers.spec.ts tests/business-partners/contacts/payment-terms-dropdown.spec.ts
```

The wrapper archives previous results, adds English failure descriptions,
generates/styles Allure and opens it. Tests run in a visible browser locally.
Final run: **20 passed, 1 failed, 21 total (8.1 minutes)**. The only functional
failure is the confirmed stale Area/City display after changing Country.
All test-owned saved customers were deleted successfully by cleanup.

## Implemented scenarios

| Area | Assertions |
| --- | --- |
| Required fields | Blank name shows validation and sends no create request. |
| Individual customer | Create, preview name/email/type, edit name, verify submitted value and reload, delete. |
| Governmental customer | Same full lifecycle with Governmental type preserved. |
| Commercial customer | Same full lifecycle with Commercial type preserved. |
| Company details | Reference, unique phone/mobile/email, website persist after reload. |
| Contact details | Two named contacts and their email addresses persist. |
| Address dependencies | Area/City initially disabled; selecting Country enables Area; additional address can be added. |
| Address text | Address, landmark and postal code persist after reload. |
| Address geography | Egypt → Cairo → Nasr City persists after saving/reopening. |
| Country change | Previous Area/City must clear when Country changes. |
| Sales settings | Payment terms and credit/alert limits persist after reload. |
| Payment terms dropdown | Dropdown scrolls without moving the page. |
| Accounting Mapping tab | Bank name, branch, SWIFT, number and IBAN persist. |
| Notes/attachments | Note and uploaded PNG URL persist after reload. |
| Active filter | All loaded matching pages contain checked status controls. |
| Suspend filter | All matching rows contain unchecked status controls. |
| Search/download | No-result search, clearing search, nonempty customer list download. |
| Pagination | All rows loaded; unique customer IDs match all loaded API page IDs. |
| Optimize | Ref column hidden and restored; original setting restored in cleanup. |
| Delete cancellation | Cancel preserves the test customer, confirmed cleanup removes it. |
| Status lifecycle | Suspend and Reactivate survive page reload. |

## Evidence and data handling

- Screenshots: `artifacts/business-partners/customers/` and per-test `test-results/` attachments.
- Create responses, edit request/response, filter responses and pagination IDs are attached to Allure.
- `CUST-E2E-*` customers created by the tests are deleted in `finally`, after capturing the screen. Failed cleanup remains a test failure.
- The manually inspected status customer #86 was reactivated and deleted successfully.
- Initial automation issues (ambiguous attachment locator, payment-term ID suffix comparison, premature edit, status controls treated as text) were corrected. They are not confirmed application defects.
- A repeated static company phone number was rejected as already taken. Company contact data is now unique per run; no conclusion about deleted-record uniqueness requirements is asserted.
- Browser HTTP 500 document responses are recorded separately from functional assertions. Successful business checks do not clear these diagnostics.

## Coverage limits

This is broad screen coverage, not a claim that every possible customer workflow is tested.

- Representative assignment remains excluded by the user's prior instruction.
- Category selection could not be exercised with existing options: the inspected dropdown only offered Create new. Category/classification/tag setup and their full filter matrix are not covered.
- Automated receivable-account creation/linking, multiple bank accounts and accounting transaction integration are not covered by bank-field persistence.
- Additional address creation is checked in the form; multiple saved address editing/removal is not yet covered.
- Customer → Both/vendor conversion, role-based permissions, localization, maximum-length/invalid-format boundaries and concurrent edits are not covered.
- Customer-associated work plans, activities, projects and transaction totals are not reconciled.
- Download checks establish successful nonempty output only; exported content parity is not asserted.
- Valid PNG persistence is covered; all file types, limits and attachment removal are not covered here.

## Confirmed address defect

Changing Country from Egypt to Saudi Arabia leaves Cairo and Nasr City visibly
selected while City becomes disabled. The standalone regression does not save
the form, so it does not establish incorrect persisted address data.

Both stale field assertions failed in the automated run: Area remained Cairo,
City remained Nasr City. Saving a valid Egypt/Cairo/Nasr City address and reopening
it passed as a separate test. See [the bug report](CUSTOMERS_BUG_REPORT_2026-10-06.md).

Manual screenshot: `artifacts/business-partners/customers/country-change-stale-area-city.png`.
