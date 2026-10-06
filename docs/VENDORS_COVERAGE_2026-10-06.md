# Vendors coverage — 2026-10-06

Scope: Business Partners → Vendors. Application Reports remain excluded.

```powershell
$env:LUXORA_LIGHT_ARTIFACTS='1'
npm test -- tests/business-partners/vendors/vendors.spec.ts
```

Execution: **19 passed, 1 failed, 20 total (6.3 minutes)**.
The only functional failure is the stale Area/City display after changing Country.
All saved test-owned vendors were removed successfully in cleanup.
See [the bug report](VENDORS_BUG_REPORT_2026-10-06.md).

## Scenarios

- Required name prevents submission.
- Individual, Governmental and Commercial vendor lifecycles: create, preview, edit/reload and delete (three scenarios).
- Vendor form defaults to Vendor type during creation.
- Purchase settings: payment terms, debit limit and debit alert limit persist.
- Address parent dependencies and adding a second address row.
- Note and valid PNG attachment persistence.
- Active and Suspend filters, checking status controls across all loaded rows (two scenarios).
- No-result search, clearing search and successful nonempty list download.
- Company contact fields with unique phone/mobile/email and reference.
- Bank name, branch, SWIFT, number and IBAN persistence.
- Address/landmark/postal-code persistence.
- Multiple contact names and email addresses persist.
- Canceling deletion preserves the vendor.
- Complete list pagination: no missing or duplicate IDs compared with loaded API pages.
- Ref column hide/restore through Optimize, with original setting restored.
- Suspend → Reactivate survives reload.
- Country change clears previous Area and City selections.
- Country/Area/City persist after saving a valid address.

The vendor list uses the shared `/sales/customers` API with `user_type_id=5,6`;
the UI routes and screenshots are specific to `/en/contacts/vendors`.

## Evidence

- Screenshots: `artifacts/business-partners/vendors/` plus per-test attachments.
- Allure includes create/update evidence, filter responses and pagination IDs.
- Test-owned `VEND-E2E-*` records are removed in cleanup after screenshots.
- Allure failure statuses remain unchanged; browser diagnostics are separate.

## Limits

These tests do not establish complete vendor business integration coverage.
Buyer assignment, category/classification/tag setup and the full filter matrix,
automatic payable-account linking, vendor-to-Both conversion, purchase invoice
and payment integration, multiple bank accounts, permissions, localization,
invalid format/size boundaries and concurrency are not covered.
Adding an address row is checked; multiple saved address edit/removal is not.
Downloads are checked for success and nonzero size, not content parity.
Valid PNG persistence does not cover every attachment type or removal behavior.
