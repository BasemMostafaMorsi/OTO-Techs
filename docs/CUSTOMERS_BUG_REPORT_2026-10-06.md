**Title:** [Customers] Changing country leaves the previous area and city visible

**Module:** Business Partners → Customers → Address Details  
**Type:** Functional / Dependent fields  
**Severity:** Medium  
**Priority:** Medium

**Steps to Reproduce:**

1. Navigate to **Business Partners → Customers → Create**.
2. Open **Address Details**.
3. Select **Egypt** in Country.
4. Select **Cairo** in Area and **Nasr City** in City.
5. Change Country to **Saudi Arabia**.
6. Inspect the Area and City fields.

**Actual Result:**

- Country displays **Saudi Arabia**.
- Area still displays **Cairo**.
- City still displays **Nasr City**, while the field becomes disabled and asks the user to select an area first.
- The form displays selections from the previous country. This check did not save the form; incorrect submitted or persisted address data has not been established.

**Expected Result:**

- Changing Country should clear the previous Area and City selections from the visible fields.
- Area should allow selection of an area belonging to the new country.
- City should remain empty and disabled until a valid area is selected.

**Evidence:**

![Country changed but previous Area/City remain](../artifacts/business-partners/customers/country-change-stale-area-city.png)

Regression: `@customers changing country clears the previous area and city` in
`tests/business-partners/customers/customers.spec.ts`. See the latest Allure result
for automated execution status and screenshots.

**Separate browser observation:** Document navigation returned HTTP 500 while the
client UI loaded. This is recorded as browser/environment diagnostics, separately
from the dependent-field defect; no server-side root cause is established.
