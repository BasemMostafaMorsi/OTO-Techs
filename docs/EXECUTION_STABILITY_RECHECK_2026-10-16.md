# Execution stability and decimal recheck — 2026-10-16 (Cairo)

## Changes

- Four Contact Settings list open helpers now leave the prior document before subscribing to a fresh list response, parse its body immediately, and await navigation and response together. This prevents a pending response from the old page satisfying the new navigation wait.
- Allure execution classification now includes hook/test timeouts and closed protocol sessions. Failed business assertions remain functional/review failures even when a screenshot or cleanup also times out. Original test statuses are preserved.
- Windows test wrapper now invokes the Playwright Node CLI without shell interpretation. Grep expressions containing pipes work as a single argument.

## Browser verification

Four previously affected scenarios passed, one worker:
- Classifications: Active filter/reset.
- Customer Categories: Governmental filter/reset.
- Industries: Active filter/reset.
- Project Categories: open selected record.

Screenshots are saved in artifacts/business-partners/contact-settings/ and attached to Allure. Current Allure contains this four-test run.

Decimal regression: both Payment and Receipt Voucher tests failed again on the configured deployed site. Input lines 0.1 and 0.2 displayed Total0.30000000000000004. This is an observed value mismatch, not an execution timeout; the assertion timeout only means the value never became the expected 0.3.

Evidence:
- artifacts/finance/accounting/payment-vouchers/decimal-total-displays-0-3-for-0-1-plus-0-2.png
- artifacts/finance/accounting/receipt-vouchers/decimal-total-displays-0-3-for-0-1-plus-0-2.png
- artifacts/allure-history/1792098833163/allure-results/ preserves the two-test decimal run and its bug reports.

## Remaining limitations

This is targeted verification, not a full-suite rerun. The Employee create page currently exposes neither User type nor the address controls referenced by older tests (artifacts/employee-form-timeout-review.png). These remain automation/requirements investigation items; their absence is not confirmed as a product bug. Accounts setup/pagination and other browser-closure failures have not been individually reproduced or claimed fixed. No application code was changed or deployed; changes remain local.
