**Title:** [Classifications] Export returns HTTP 404 and no file downloads

**Module:** Business Partners → Contact Settings → Classifications  
**Type:** Functional / Export  
**Severity:** Medium  
**Priority:** Medium

**Steps to Reproduce:**

1. Open **Business Partners → Contact Settings → Classifications**.
2. Wait for the classification records to load.
3. Click **Export**.
4. Check the export request and downloaded files.

**Actual Result:**

- `GET /api/v1.0/sales/classifications/export?` returns **HTTP 404**.
- The response is `{"data":null,"is_success":false,"message":"Class not found"}`.
- No file downloads; the original test timed out waiting for the download.
- Exported field/value parity cannot be checked because the export did not produce a file.

**Expected Result:**

- Export should return a successful response.
- A nonempty classification export file should download.

**Evidence:**

- Allure attachment: `classification-export-response`, with URL, status and error body.
- Screenshot: `artifacts/business-partners/contact-settings/classifications/-classifications-list-IDs-search-reset-and-download.png`.
- Reproduced through the visible browser and covered by the explicit export-response assertion.

**Scope:** This is a classification-list export, not a Finance report test.
HTTP 500 document navigation and notification-permission diagnostics are recorded
separately; they are not asserted to be the cause of this 404.
