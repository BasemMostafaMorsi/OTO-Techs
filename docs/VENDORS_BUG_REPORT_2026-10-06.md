**Title:** [Vendors] Changing country leaves the previous area and city visible

**Module:** Business Partners → Vendors → Address Details  
**Type:** Functional / Dependent fields  
**Severity:** Medium  
**Priority:** Medium

**Steps to Reproduce:**

1. Navigate to **Business Partners → Vendors → Create**.
2. Open **Address Details**.
3. Select **Egypt** in Country, **Cairo** in Area and **Nasr City** in City.
4. Change Country to **Saudi Arabia**.
5. Inspect Area and City without saving the form.

**Actual Result:**

- Country displays **Saudi Arabia**, but Area still displays **Cairo**.
- City still displays **Nasr City** and becomes disabled.
- Both stale-field assertions failed in the automated run.
- Incorrect submitted or persisted data is not established by this unsaved-form test.

**Expected Result:**

- Changing Country clears the previous Area and City selections from the visible fields.
- Area allows a valid selection belonging to the new country.
- City remains empty and disabled until an area is selected.

**Evidence:**

![Vendor address failure](../artifacts/business-partners/vendors/-vendors-changing-country-clears-the-previous-area-and-city.png)

Test: `@vendors changing country clears the previous area and city`.
The full run completed with **19 passed and 1 failed**. Saving and reopening a
valid Egypt/Cairo/Nasr City address passed separately. The same visible behavior
was also confirmed on Customers; a shared implementation is not proven from
these black-box tests.

**Separate browser diagnostics:** HTTP 500 document responses and notification
permission errors are attached to Allure independently of functional failures.
