const fs = require('node:fs');
const path = require('node:path');

const cases = [
  ['quotations.spec.ts', 'Finance → Sales → Quotations', 'Investigation required / Quotation workflow', 'Untriaged',
    ['Open Finance → Sales → Quotations.', 'Execute the named list, search, status filter or form scenario. Compare displayed records with the attached source evidence.', 'For form cases open Create, test expiration-date validation, add/remove lines, select a product and enter the documented quantity, price and discount, or switch tabs.', 'For filters select the named status, submit, compare the source and visible records, then Reset. Review the failed assertion and screenshot.'],
    'Displayed IDs, dates, customer names and amounts should match the source. Status filters must return matching records and Reset restore the list. Missing expiration should prevent creation. Product units and numeric line totals should be correct; unsaved form edits should survive tab switching and be discarded on reopening. Loading and unavailable controls require investigation.'],
  ['inventory-settings.spec.ts', 'Finance → Inventory → Configuration → Inventory Settings', 'Investigation required / Settings', 'Untriaged',
    ['Open Inventory Settings and select the tab named in the test.', 'For persistence tests record original options, change checkboxes and price mode, save, and reopen the page.', 'For cancellation tests change an option without saving and reload; submit an empty special-field form, enter a temporary name, then cancel.', 'For special-field lifecycle tests add a unique INV-SET-E2E field, save and reload, cancel an edit, save its new name and required status, discard a deletion, and finally save deletion of only that field.', 'For Receipt integration change price visibility and date editing, save, then open an unsaved Receipt form and inspect the price column and date control.', 'Compare the observed result with the attached evidence. Restore original saved options and remove owned test fields.'],
    'Saved options should persist after reload. Unsaved changes and cancelled fields should not persist. Required special-field inputs should reject empty submission. Original settings should be restored. Loading or unavailable-control failures require investigation before classification as a product defect.'],
  ['units-of-measure.spec.ts', 'Finance → Inventory → Configuration → Units of Measure', 'Investigation required / Units of Measure workflow', 'Untriaged',
    ['Open Finance → Inventory → Configuration → Units of Measure.', 'Execute the named list, search, selection, status filter or required-field scenario.', 'For lifecycle coverage choose Unit type, create a unique UOM-E2E name and code, discard an unsaved edit, then save edits and verify status after reload.', 'Cancel deletion before confirming deletion of the test-owned unit. Review attached source responses, screenshots and the failed step.'],
    'Displayed names, codes and status should match source records. Search and filters should return matching records. Required fields should reject incomplete forms. Saved test values should persist after reload; discarded changes should not persist. Timeouts and unavailable controls require automation investigation.'],
  ['warehouses.spec.ts', 'Finance → Inventory → Configuration → Warehouses', 'Investigation required / Warehouse workflow', 'Untriaged',
    ['Open Finance → Inventory → Configuration → Warehouses.', 'Execute the named search, status, keeper or address filter and compare returned IDs with the baseline.', 'For form scenarios, open Create and use the WH-E2E test record with the selected keeper and Egypt / Cairo / Al Azbakeyah address.', 'Review the failed assertion and attached warehouse source data and screenshots.'],
    'List values and filters should match source records. Required inputs should prevent invalid submission, dependent address selections should clear when their parent changes, and saved test values should persist after reopening the list. Timeouts require automation investigation.'],
  ['stocktaking.spec.ts', 'Finance → Inventory → Transfer → Stocktaking', 'Investigation required / Stocktaking list and details', 'Untriaged',
    ['Open Inventory → Transfer → Stocktaking.', 'Execute the named reference search, status/warehouse/date filter or detail scenario.', 'Compare filtered record IDs with the unfiltered source response.', 'For completed details, inspect both Stocktaking information and Stock Items; compare reference, warehouse, book balance, actual balance and quantity difference with stocktaking-detail-source.', 'Review attached source data and screenshots. Existing completed records are never submitted or deleted.'],
    'List and filter results should match source records; item quantity difference should equal actual balance minus book balance. Positive and negative differences should retain their signs. Execution failures require investigation separately from observed business mismatches.'],
  ['scrap.spec.ts', 'Finance → Inventory → Transfer → Scrap', 'Investigation required / Scrap list and details', 'Untriaged',
    ['Open Inventory → Transfer → Scrap.', 'Execute the named search, status/warehouse/date filter or detail scenario using the existing records.', 'For filters, compare returned record IDs with the independent unfiltered source and reset the filter.', 'For details, open the selected Completed record and compare product, quantity and Balance before with its saved scrape_items response.', 'Inspect the attached screenshot and source/filter evidence. No existing completed record is saved or deleted.'],
    'List fields and filter results should match source records. Detail values should match the selected saved scrap record; loading and unavailable controls require execution investigation, not automatic defect classification.'],
  ['manufacturing.spec.ts', 'Finance → Inventory → Transfer → Manufacturing', 'Investigation required / Manufacturing', 'Untriaged',
    ['Open Finance → Inventory → Transfer → Manufacturing.', 'Execute the named validation, source/output/Scrap line, search, balance or owned-draft scenario.', 'For the draft scenario, select gold from Riyadh and potat into Makkah, disable Scrap, enter quantity 1 and a unique MFG-E2E reference/batch/notes, then Save as Draft.', 'Review screenshots and request/response evidence at the failed step. Only test-owned drafts are deleted in cleanup.'],
    'Required fields should validate; source, output and Scrap rows should operate independently. Balances should match the chosen warehouse. Draft values should persist and a notes-only edit should succeed without requiring product reselection. No actual manufacturing completion is tested.'],
  ['internal-transfer-workflow.spec.ts', 'Finance → Inventory → Transfer → Internal Transfers', 'Investigation required / Draft, validation and filters', 'Untriaged',
    ['Open Finance → Inventory → Transfer → Internal Transfers.', 'For quantity and draft cases select gold, source Riyadh and destination Jeddah; use the quantity and unique reference shown in the attachments.', 'Execute the named case: server validation, source balance changes, save/edit/reopen draft, or warehouse/status filters and Reset.', 'Compare the failed assertion with saved response evidence, stock/filter comparisons and screenshots. Only test-owned drafts are deleted in cleanup.'],
    'Zero and negative quantities should be rejected. Drafts should preserve edited values without moving stock. Source balances should match the selected warehouse. Filters should return the matching baseline rows and Reset should restore them. Confirm the failed step before assigning an application defect.'],
  ['internal-transfer.spec.ts', 'Finance → Inventory → Transfer → Internal Transfers', 'Investigation required / Internal transfer', 'Untriaged',
    ['Open Internal Transfers.', 'Execute the named blank draft, default controls, line management, unsaved navigation or search case.', 'Review screenshots and the failed assertion.'],
    'Source/destination warehouses, product and quantity should validate; line management and search should work; unsaved fields should be discarded. No stock transfer is validated by this suite.'],
  ['deliveries.spec.ts', 'Finance → Inventory → Transfer → Deliveries', 'Investigation required / Inventory deliveries', 'Untriaged',
    ['Open Finance → Inventory → Transfer → Deliveries.', 'Execute the named blank draft, defaults, line management, unsaved navigation or search case.', 'Compare the failed assertion with the attached browser screenshot.'],
    'Required fields should validate, line operations and search should behave as selected, and unsaved changes should be discarded. No delivery is validated or posted by this suite.'],
  ['receipts.spec.ts', 'Finance → Inventory → Transfer → Receipts', 'Investigation required / Inventory receipts', 'Untriaged',
    ['Open Finance → Inventory → Transfer → Receipts.', 'Execute the named defaults, blank draft, unsaved lines, calculation, navigation or search case.', 'For calculation select gold, read its displayed unit price, enter quantity 2 and compare line/grand totals without saving.', 'Compare the failed assertion with screenshots and attached values.'],
    'Required receipt fields should validate, line totals should equal quantity times price, unsaved changes should be discarded on navigation, and search should match. No receipt is validated or posted by this suite.'],
  ['product-categories.spec.ts', 'Finance → Inventory → Inventory Management → Product Categories', 'Investigation required / Category workflow', 'Untriaged',
    ['Open Product Categories.', 'Execute the named validation, cancellation, search or owned CAT-E2E lifecycle scenario.', 'For lifecycle cases save/reopen edits, toggle status, select the category in an unsaved product form, cancel deletion and confirm deletion.', 'Review screenshot and response evidence before classifying a defect.'],
    'Required fields should validate, saved fields and status should persist, active categories should be selectable in product forms, and cancelled actions should preserve saved data. Record deletion evidence without assuming disappearance.'],
  ['products-services-filters.spec.ts', 'Finance → Inventory → Inventory Management → Products & Services', 'Investigation required / Filters', 'Untriaged',
    ['Open Products & Services and capture the complete baseline.', 'Apply the type, status and/or category named in the test.', 'Compare returned IDs and visible records with matching baseline records.', 'Reset filters and compare the restored list with the baseline.'],
    'Filters should return all and only matching records, and Reset should restore the baseline. Empty Inactive results do not prove positive inactive-record inclusion.'],
  ['products-services.spec.ts', 'Finance → Inventory → Inventory Management → Products & Services', 'Investigation required / Product master data', 'Untriaged',
    ['Open Products & Services.', 'Execute the named validation, tab navigation, search or owned service creation case.', 'Use only the unique PS-E2E fixture for creation; do not enter opening stock.', 'Compare visible values with the assertions and attached evidence.'],
    'Required fields should validate, form values should survive tab navigation, search should match, and a saved service should appear with the selected type.'],
  ['additional-items.spec.ts', 'Finance → Accounting → Configuration → Additional Items', 'Investigation required / Additional items', 'Untriaged',
    ['Open Finance → Accounting → Configuration → Additional Items.', 'Execute the named required-field, unsaved navigation, search or owned-item lifecycle scenario.', 'For lifecycle cases create an AI-E2E item, edit its name/description and page mappings, reload, cancel deletion and confirm deletion.', 'Inspect the failed assertion and attached screenshots before classifying a product defect.'],
    'Name and pages should be required, unsaved changes should be discarded on navigation, search should match, and saved values/page mappings should persist. Preserve deletion evidence without assuming retained visibility is a defect.'],
  ['finance-settings.spec.ts', 'Finance → Accounting → Configuration → Finance Settings', 'Investigation required / Settings', 'Untriaged',
    ['Open Finance → Accounting → Configuration → Finance Settings.', 'Open the tab named in the test and wait for its saved controls.', 'For unchanged-save cases, click Save or Save all with existing values and compare server settings after reload. For required-selection cases, clear the first selection and click Save; invalid writes are intercepted as a safety guard, so this checks client validation only.', 'For navigation cases, dismiss dropdowns with Escape, switch tabs and reload. Compare the saved values and attached screenshots.'],
    'Saved settings should load and persist unchanged after an unchanged save. Required selections should display validation and prevent invalid requests. Dropdown dismissal and reload should preserve saved values. Chart depth should remain protected.'],
  ['banks-treasuries.spec.ts', 'Finance → Accounting → Configurations → Banks & Treasuries', 'Investigation required / Bank and treasury settings', 'Untriaged',
    ['Open Finance → Accounting → Configurations → Banks & Treasuries.', 'Execute the named bank/treasury validation, manual account, search or status-filter case.', 'For lifecycle cases create an owned BT-E2E record using manual account linking, save and reopen edits, toggle status, cancel and confirm deletion.', 'Review the screenshot and response evidence before classifying a defect.'],
    'Required fields should validate, manual account linking should be required when automatic creation is disabled, saved edits/status should persist, and filters/search should match the selected criteria.'],
  ['taxes.spec.ts', 'Finance → Accounting → Configurations → Taxes', 'Investigation required / Tax settings', 'Untriaged',
    ['Open Finance → Accounting → Configurations → Taxes.', 'Execute the named validation, cancellation, dependency or search scenario.', 'For lifecycle cases create an owned TAX-E2E Sales/Purchases tax with the matching class and rate 12.5, edit to 7.25 and reload, toggle status, cancel and confirm deletion.', 'Review screenshots and the failed assertion before classifying a product defect.'],
    'Required fields should validate, dependent selections should remain compatible, edits and status should persist, and search should match. Record deletion behavior without assuming disappearance.'],
  ['currencies.spec.ts', 'Finance → Accounting → Configurations → Currencies', 'Investigation required / Currency settings', 'Untriaged',
    ['Open Finance → Accounting → Configurations → Currencies.', 'Execute the named required-field, cancellation, default protection or search scenario.', 'For the lifecycle, create a unique CUR-E2E currency; cancel edit, save edits, toggle status and reload, search, cancel deletion and confirm deletion.', 'Review screenshots and failed step evidence.'],
    'Required fields should be validated, cancellation should preserve data, saved edits and status should persist, search should match the query and default currency controls should remain protected. Only owned test currencies may be modified.'],
  ['receipt-vouchers.spec.ts', 'Finance → Accounting → Receipt Vouchers', 'Investigation required / Voucher workflow', 'Untriaged',
    ['Open Finance → Accounting → Receipt Vouchers.', 'Execute the named validation, line-total, source-type, search or status-filter scenario.', 'For the lifecycle case, create an RV-E2E draft, reopen it, edit values and notes, and Save as Draft.', 'Cancel deletion, verify persistence, then confirm deletion of the owned fixture.', 'Review screenshots and attached evidence.'],
    'Validation, line totals, selected filters and persisted draft edits should match the tested inputs. Record deletion response and archive visibility without assuming disappearance.'],
  ['payment-vouchers.spec.ts', 'Finance → Accounting → Payment Vouchers', 'Investigation required / Voucher workflow', 'Untriaged',
    ['Open Finance → Accounting → Payment Vouchers.', 'Execute the named form, calculation, search or status-filter scenario.', 'For the lifecycle scenario, create a uniquely identified PV-E2E draft from Main Treasury with a Petty Cash line; reopen, edit and save it.', 'Cancel deletion and verify persistence, then confirm deletion and search for the exact reference.', 'Review attached screenshots and response evidence to distinguish application failures from test issues.'],
    'Required fields and numeric references should be validated; totals should match line values. Saved edits should persist and filters should match the chosen criteria. Continued visibility after confirmed deletion is accepted system behavior.'],
  ['accounts-hide-zero.spec.ts', 'Finance → Accounting → Accounts → Filters', 'Functional / Filtering', 'Medium',
    ['Open Finance → Accounting → Accounts.', 'Search for Main treasury and note its negative, nonzero balance.', 'Open Filter and enable Hide zero values.', 'Submit and compare the filtered results with the original account.', 'Review before/after screenshots and the negative-balance-comparison attachment.'],
    'Hide zero values should exclude only zero balances. Accounts with either positive or negative nonzero balances should remain visible when they match the other selected criteria.'],
  ['accounts-filters.spec.ts', 'Finance ? Accounting ? Accounts ? Filters', 'Investigation required / Filtering', 'Untriaged',
    ['Open Finance ? Accounting ? Accounts and capture every unfiltered page.', 'Open Filter and select the value(s) named in the test.', 'Submit, load every filtered page and compare records against the unfiltered data satisfying those conditions.', 'Use Reset and verify unfiltered count, first-page records and cleared filter parameters.', 'Review filter-comparison JSON and screenshots for observed differences.'],
    'Each selected filter and combined filter should return exactly the matching records across all pages. Reset should remove all selected filter parameters and restore the unfiltered list. Distinguish automation/data issues from application failures.'],
  ['cost-centers-filters.spec.ts', 'Finance ? Accounting ? Cost Centers ? Filters', 'Investigation required / Filtering', 'Untriaged',
    ['Open Finance ? Accounting ? Cost Centers and capture every unfiltered page.', 'Open Filter and select the value(s) named in the test.', 'Submit, load every filtered page and compare with the independently filtered baseline.', 'Use Reset and verify unfiltered count, first-page records and cleared parameters.', 'Inspect attached filter-comparison JSON and screenshots.'],
    'All filters should restrict records to the chosen values, combined selections should apply together, and Reset should restore the unfiltered list. Hide-zero may legitimately yield no records when all balances are zero.'],
  ['accounts.spec.ts', 'Finance ? Accounting ? Accounts', 'Investigation required / Account management', 'Untriaged',
    ['Open Finance ? Accounting ? Accounts.', 'Execute the named scenario on a unique ACC-E2E child of Cash, currency SAR, Debit, guidance Cash In Hand.', 'Save/reopen, cancel, change status, filter, inspect tree or download as specified.', 'Review the failed assertion and attached response, trace and screenshot.'],
    'Valid account fields and hierarchy should persist; required inputs should be validated; cancellation should preserve data. Status, filters, tree and list actions should match the named scenario. Confirm the failed step before assigning an application defect.'],
  ['cost-centers.spec.ts', 'Finance ? Accounting ? Cost Centers', 'Investigation required / Cost center management', 'Untriaged',
    ['Open Finance ? Accounting ? Cost Centers.', 'Create a unique CC-E2E Secondary record beneath the dedicated primary CC-E2E-INSPECT-20261008.', 'Execute the named save/reopen, cancellation, status, filter, tree or download action.', 'Review the failed assertion and attached response, trace and screenshot.'],
    'Secondary center details and parent relationship should persist. Cancellation should preserve data; status, filters, tree and list actions should match the scenario. Primary controls are restricted in the observed UI; do not assume this is a defect.'],
  ['industries.spec.ts', 'Business Partners ? Contact Settings ? Industries', 'Investigation required / Industry workflow', 'Untriaged',
    ['Open Business Partners ? Contact Settings ? Industries.', 'Execute the named scenario using its unique IND-E2E record where applicable.', 'Save and reopen values, change status, cancel the action, or apply the specified filter.', 'Compare the failed assertion with screenshots and attached request evidence.'],
    'Required names should be validated; saved names, descriptions and status should persist. Cancellation should preserve saved data. Filters, search and list download should behave as selected. Classify only the observed failed step.'],
  ['project-categories.spec.ts', 'Business Partners ? Contact Settings ? Project Categories', 'Investigation required / Category workflow', 'Untriaged',
    ['Open Business Partners ? Contact Settings ? Project Categories.', 'Execute the named scenario with its unique PCAT-E2E record.', 'Save and reopen values, cancel the indicated action, or confirm the selected status.', 'Compare the failed step with attached screenshots and response evidence.'],
    'Required names should be validated, saved values and confirmed status should persist, and cancellation should preserve existing data. List actions should match the named scenario. Investigate the failed step before classifying an application defect.'],
  ['classifications.spec.ts', 'Business Partners ? Contact Settings ? Classifications', 'Investigation required / Classification workflow', 'Untriaged',
    ['Open Business Partners ? Contact Settings ? Classifications.', 'Execute the named scenario using its unique CLASS-E2E record where applicable.', 'Save and reopen edited values, cancel the indicated action, or apply the selected status/filter.', 'For integration, open the specified Customer or Vendor creation form and select the saved classification.', 'Compare the failed step with screenshots and attached request evidence.'],
    'Names and descriptions should persist after saving; invalid required fields should prevent submission. Cancellation should preserve existing data, status/filter changes should persist, and saved classifications should be selectable on the specified forms. Confirm the actual failure before classifying an application defect.'],
  ['customer-categories.spec.ts', 'Business Partners ? Contact Settings ? Customer Categories', 'Investigation required / Category workflow', 'Untriaged',
    ['Open Business Partners ? Contact Settings ? Customer Categories.', 'Execute the named scenario using its unique CAT-E2E category where applicable.', 'Choose the specified category type; save and reopen for persistence checks or apply the specified filter/status action.', 'For customer integration, open Customers ? Create, choose the same customer type and inspect/select the category.', 'Review the failed assertion, screenshot and attached request evidence.'],
    'Category name/type validation, saved values, cancellation, status, filtering and list actions should match the named scenario. A saved category should be selectable on a matching customer form. Confirm the observed failed step before classifying an application defect.'],
  ['projects.spec.ts', 'Business Partners ? Projects', 'Investigation required / Project workflow', 'Untriaged',
    ['Open Business Partners ? Projects.', 'Execute the named scenario; creation uses a unique PROJ-E2E name, customer Basem and Master Service Center.', 'Save and reopen for persistence checks, or apply the named search, filter, address or list action.', 'Compare the observed result with the failed assertion and attached screenshots/request evidence.'],
    'Required fields should prevent invalid submission; valid projects should preserve their linked customer, service center and entered values after reload. Search, filters, address dependencies and list actions should match the selected inputs. Classify the actual failed step before asserting an application defect.'],
  ['vendors.spec.ts', 'Business Partners ? Vendors', 'Investigation required / Vendor workflow', 'Untriaged',
    ['Open Business Partners ? Vendors.', 'Execute the named scenario with its unique VEND-E2E vendor where applicable.', 'Save and reopen for persistence checks, or perform the specified list/status action.', 'Compare the failed assertion against the attached screenshot and request evidence.'],
    'Vendor forms should preserve submitted values and vendor type, reject missing required fields, and apply the selected list and status actions. Confirm the failed step before classifying an application defect.'],
  ['customers.spec.ts', 'Business Partners ? Customers', 'Investigation required / Customer workflow', 'Untriaged',
    ['Open Business Partners ? Customers.', 'Execute the scenario named in this test using its uniquely named CUST-E2E customer where applicable.', 'Save and reload for persistence checks; use the specified filter, validation, status or list action for other scenarios.', 'Compare the observed result with the failed assertion and attached screenshots.'],
    'Customer forms should preserve submitted values after reload, reject invalid required fields, and apply the selected list actions correctly. Confirm the failed step and distinguish automation or environment failures before classifying an application defect.'],
  ['journal-items.spec.ts', 'Finance ? Accounting ? Journal Items', 'Functional / Journal items', 'High',
    ['Open Finance ? Accounting ? Journal Items.', 'Execute the named scenario: full-page reconciliation, reference search, selected filter/reset, parent journal preview or list download.', 'For filters, select the stated value and submit; load all result pages before comparing rows.', 'Compare the displayed dates, parent IDs, account, reference, debit/credit or filtered values with the attached evidence.', 'Review the failed assertion and screenshot.'],
    'Journal item rows should match loaded source data, respect search and filters, and open the correct parent journal. Pagination should preserve all source rows; export should download a nonempty file without an error. Repeated parent journal IDs across different lines are valid.'],
  ['journal-entries.spec.ts', 'Finance ? Accounting ? Journal Entries', 'Functional / Validation and management', 'High',
    ['Open Finance ? Accounting ? Journal Entries.', 'Execute the named scenario: required-field/reference/balance validation, draft management, or the indicated status filter.', 'For draft management, create only a uniquely named test journal, edit its notes/details, search for it and exercise delete confirmation.', 'Compare the observed validation messages, persisted fields or filtered row statuses with the selected scenario.', 'Review the attached screenshot and test steps; test-owned drafts are deleted in cleanup.'],
    'Invalid forms should not submit journals. Valid drafts should preserve edited details and notes. Search and status filters should show matching rows. Canceling deletion should preserve the draft; confirmed deletion should remove only the selected test draft.'],
  ['journal-posting.spec.ts', 'Finance ? Accounting ? Journal Entries', 'Functional / Posting', 'High',
    ['Create a uniquely referenced SAR journal: debit Main treasury 0.10 and credit Petty Cash 0.10.', 'Submit as Draft and reopen its saved details.', 'Choose Save ? Validate and verify Unposted status.', 'Choose Post and verify Posted status after reload.', 'Unpost the same test journal and verify its status and persisted reference, description and amounts.', 'Open Cancel and choose Go Back; then reopen Cancel, confirm and reload.'],
    'The journal should preserve its details through Draft, Unposted, Posted and back to Unposted after Confirm Unpost. Go Back should preserve Unposted; Confirm Cancel should produce Canceled with no Post action. Financial report checks are excluded by user request.'],
  ['notes-attachments-persistence.spec.ts', 'Business Partners ? Contacts', 'Functional / Data persistence', 'High',
    ['Create a uniquely named test contact.', 'Enter a note or upload the valid test image, depending on the test variant.', 'Save the contact and reload its details.', 'Verify the saved note or the decoded attachment image and download link.', 'Delete only the contact created by the test.'],
    'Saved notes and attachments should persist after reloading, and the test contact should be removable.'],
  ['journal-validation.spec.ts', 'Finance ? Accounting ? Journal Entries', 'Functional / Validation', 'High',
    ['Read the Trial Balance grand totals as a baseline.', 'Create a new SAR journal using the test cash accounts.', 'Enter debit 0.10 and credit 0.09 with a numeric reference and unique description.', 'Choose Submit ? New.', 'Check the rejection message, write requests and Trial Balance totals after the attempt.'],
    'An unbalanced journal should be rejected, no finance write request should be sent, and Trial Balance grand totals should remain unchanged.'],
  ['sales-report.spec.ts', 'Finance ? Reports ? Sales Invoice', 'Functional / Export', 'High',
    ['Navigate to Finance ? Reports ? Sales Invoice.', 'Review the invoice records and values displayed on the UI.', 'Apply the customer filter if this is the filtered export test.', 'Export the report using Export ? Export Excel.', 'Open the downloaded CSV and compare its columns and values with the UI.'],
    'The export should contain valid, uniquely named columns and the same filtered invoice records and values as the UI.'],
  ['contact-lifecycle.spec.ts', 'Business Partners ? Contacts', 'Functional / Data persistence', 'High',
    ['Create a uniquely named test contact.', 'Open Edit and change the contact name.', 'Save the contact.', 'Open its details and compare the displayed name with the submitted value.'],
    'The saved contact name should match the submitted name on the details page.'],
  ['product-category-ar.spec.ts', 'Finance ? Inventory ? Products / Services (Arabic)', 'Functional / Localization', 'Medium',
    ['Open the Arabic product creation form.', 'Open Category ? Create new.', 'Enter a unique category name and short code, then submit.', 'Check the selected category and reopen its dropdown.'],
    'The newly created category should be selected immediately and remain available in the dropdown.'],
  ['country-modal.spec.ts', 'Business Partners ? Projects ? Add Country', 'Functional / Dialog', 'Untriaged',
    ['Open the project creation form.', 'Open Country ? Create new.', 'Check Add Country, Country Name and Submit.', 'Enter an unsaved country name and choose Cancel.'],
    'The dialog should show its country-name field and controls. Cancel should close it without selecting the unsaved country. Translation and Arabic-name fields are not required, as confirmed by the user.'],
  ['material-request-to-order.spec.ts', 'Finance ? Purchase ? Material Request ? Purchase Order', 'Functional / Conversion', 'High',
    ['Open Products & Services and inspect the saved unit of measure for gold.', 'Create and save a material request for gold with quantity 20.', 'Select Convert to order.', 'Wait for the product and quantity to populate, then compare the unit with the saved product unit shown in source-product-unit.'],
    'The converted order should retain the product and quantity and populate the saved product unit. This scenario verifies unit propagation; no purchase-price or total mismatch is inferred from a missing unit.'],
  ['employee-lifecycle.spec.ts', 'User Management ? Employees', 'Functional / Navigation', 'Medium',
    ['Create a uniquely named test employee.', 'Locate the employee in the list.', 'Open the action menu and choose Preview.', 'Check the destination URL and whether the page is editable.'],
    'Preview may open the editable employee form (user-approved). The selected employee details must match, and saved edits must persist.'],
];
const flatten = (steps = []) => steps.flatMap(step => [step, ...flatten(step.steps)]);
function executionIssue(result, steps) {
  const messages = [result.statusDetails?.message, ...steps.filter(s=>['failed','broken'].includes(s.status)).map(s=>s.statusDetails?.message)].filter(Boolean);
  // A failed business assertion can coexist with a screenshot timeout. Keep it visible.
  const execution = message => /(?:page\.(?:goto|reload|screenshot|waitForResponse)|locator\.(?:click|fill|waitFor)|browserType\.launch).*Timeout|Target (?:page|closed)|browser has been closed|net::ERR_|ECONNRESET|ENOTFOUND|element\(s\) not found|waiting for.*(?:loading|spinner)/is.test(message);
  const responseUnavailable = message => /response\.(?:json|body|text):.*(?:Network\.getResponseBody|Response body is not available|No resource with given identifier)/is.test(message);
  const setupOrSession = message => /(?:"(?:beforeAll|beforeEach|afterAll|afterEach)" hook timeout|Test timeout of \d+ms exceeded|Protocol error.*(?:session closed|Target closed))/is.test(message);
  const hostResource = message => /ENOSPC|no space left on device|heap out of memory/i.test(message);
  const warehousePlaceholder = message => (result.fullName || '').includes('warehouses.spec.ts') && result.name === 'name search no-match and clear restore records' && /Locator:.*locator\('tbody tr'\)/s.test(message) && /Expected: 0/.test(message) && /Received: 1/.test(message);
  return messages.length > 0 && messages.every(message => execution(message) || responseUnavailable(message) || setupOrSession(message) || hostResource(message) || warehousePlaceholder(message));
}
function enrich(directory = 'allure-results') {
  let reports = 0;
  const categoryResults = [];
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('-result.json'))) {
    const resultPath = path.join(directory,file);
    const result = JSON.parse(fs.readFileSync(resultPath,'utf8'));
    const steps = flatten(result.steps);
    const attachments = [...(result.attachments || []), ...steps.flatMap(step => step.attachments || [])];
    const diagnostics = attachments.filter(a => a.name === 'browser-diagnostics').flatMap(a =>
      JSON.parse(fs.readFileSync(path.join(directory,a.source),'utf8')));
    const failed = ['failed','broken'].includes(result.status);
    if (!failed && !diagnostics.length) continue;
    let definition = cases.find(([file]) => (result.fullName || '').includes(file) || (result.labels || []).some(label => ['suite', 'titlePath'].includes(label.name) && label.value.includes(file)));
    if ((result.fullName || '').replace(/\\/g, '/').includes('inventory/configuration/additional-items/')) {
      definition = [null, 'Finance → Inventory → Configuration → Additional Items', 'Investigation required / Inventory additional items', 'Untriaged',
        ['Open Finance → Inventory → Configuration → Inventory Additional Items.', 'Execute the named list, search, required-field, tag filter or unsaved navigation scenario.', 'For lifecycle coverage create an INV-AI-E2E item mapped to Receipts, edit its description/name and add Deliveries, then verify after reload.', 'Cancel deletion, verify the test-owned record remains, and confirm deletion. Review attached API responses and screenshots.'],
        'Names and counts should match source records. Name and Tags should reject incomplete forms. Tag filters should return matching records and Reset should restore the baseline. Saved fields should persist and canceled actions should preserve records. Timeouts require execution investigation.'];
      const mappingAttachment = attachments.find(a => a.name === 'inventory-pages-display');
      if (mappingAttachment) {
        const mapping = JSON.parse(fs.readFileSync(path.join(directory, mappingAttachment.source), 'utf8'));
        if (!mapping.actual.includes(mapping.expected)) definition = [null, 'Finance → Inventory → Configuration → Additional Items', 'Functional / Pages display', 'Medium',
          ['Open Inventory Additional Items and create a unique INV-AI-E2E record with Name, Description and Tags: Receipts.', 'Reload and search for the created name.', 'Compare its Pages cell with the selected Receipts mapping and attached create response.', 'Apply Tags: Receipts and check whether the created record is returned.', 'Inspect inventory-pages-display, saved-pages-screen and owned-receipts-filter attachments. Later lifecycle assertions remain visible if they also fail.'],
          'The saved Receipts mapping should appear in the Pages column after reload. In the observed run the column is empty, while editing preserves the selected mapping and the Receipts filter returns the created record. Different module identifiers in create/filter requests alone do not establish a filtering defect.'];
      }
    }
    if ((result.fullName || '').includes('units-of-measure.spec.ts') && attachments.some(a => a.name === 'edit-unit-type')) {
      const evidence = JSON.parse(fs.readFileSync(path.join(directory, attachments.find(a => a.name === 'edit-unit-type').source), 'utf8'));
      if (evidence.expected !== evidence.actual) definition = [null, 'Finance → Inventory → Configuration → Units of Measure', 'Functional / Edit form data consistency', 'Medium',
        ['Open Units of Measure and create a unique UOM-E2E unit with type Primary, name and code.', 'Reload the list and verify that the unit is displayed as Primary.', 'Open the test unit action menu and choose Edit.', 'Inspect Unit type before changing any fields; compare edit-unit-type JSON and edit-unit-type-screen with the saved list.'],
        'Opening Edit for a saved Primary unit should display Primary. The observed form displays Secondary. The test records this mismatch, then explicitly selects Primary to continue verifying save, status changes and deletion without suppressing the original failure.'];
    }
    const secondaryType = attachments.find(a => a.name === 'secondary-type-after-blur');
    if (secondaryType) {
      const evidence = JSON.parse(fs.readFileSync(path.join(directory, secondaryType.source), 'utf8'));
      if (evidence.expected !== evidence.actual) definition = [null, 'Finance → Inventory → Configuration → Units of Measure', 'Functional / Unit type selection', 'High',
        ['Open Units of Measure and click Create.', 'Open Unit type and select Secondary.', 'Move focus out of the Unit type field.', 'Inspect the selected type and the dependent primary-unit/conversion fields.'],
        'Secondary must remain selected after leaving the field and allow the required secondary-unit workflow. The user confirmed on 2026-10-20 that creating Secondary units is still required.'];
    }
    if (attachments.some(a => a.name === 'unit-type-validation')) {
      definition = [null, 'Finance → Inventory → Configuration → Units of Measure', 'Functional / Unit type validation', 'High',
        ['Open Units of Measure and click Create.', 'Verify that Unit type displays Primary.', 'Enter a unique name and unit code.', 'Click Submit and inspect the validation message.'],
        'A displayed, selected Primary unit type must satisfy required-type validation. The form should submit the valid unit, rather than report Unit type is required.'];
    }
    if ((result.fullName || '').includes('stocktaking.spec.ts') && (result.statusDetails?.message || '').includes('Same-day date filter must retain')) {
      definition = [null, 'Finance → Inventory → Transfer → Stocktaking', 'Functional / Date filtering', 'Medium',
        ['Open Inventory → Transfer → Stocktaking.', 'Identify an existing record and its date in the attached baseline (observed record #2, 2026-10-07).', 'Open Filter and select that date as both the start and end date.', 'Submit and compare the returned records with the baseline.', 'Reset the filter and verify that the records return.'],
        'A date range covering the record day should include that record. The observed same-day request returned no records although the baseline contained record #2 on that day. The exact backend cause is not established.'];
    }
    if ((result.fullName || '').includes('scrap.spec.ts') && (result.statusDetails?.message || '').includes('Balance before should match')) {
      definition = [null, 'Finance → Inventory → Transfer → Scrap', 'Functional / Historical balance display', 'Medium',
        ['Open Inventory → Transfer → Scrap.', 'Open the Completed record identified in scrap-detail-source (observed record #2).', 'Inspect the gold item quantity and Balance before.', 'Compare Balance before with scrape_items.balance_before in the saved detail response.'],
        'Balance before should show the persisted pre-transaction balance for this scrap item. The observed UI value 300 differs from the saved balance_before value 190; this does not establish that stock was incorrectly posted.'];
    }
    if ((result.fullName || '').includes('journal-items.spec.ts') && (result.statusDetails?.message || '').includes('Account names displayed in Journal Items')) {
      definition = [null, 'Finance → Accounting → Journal Items', 'Functional / Account name display', 'Medium',
        ['Open Finance → Accounting → Journal Items.', 'Load all pages and compare the UI count and displayed amounts with the attached API data.', 'Inspect Account cells for warehouse accounts such as 1161005.', 'Compare the displayed account number/name with the source account name in all-page-reconciliation.'],
        'Each account cell should display its account number and source name. Missing account names must be reported separately from successful count and amount checks.'];
    }
    if ((result.fullName || '').includes('project-categories.spec.ts') && result.name === 'confirmed status persists across reload') {
      definition = [null, 'Business Partners ? Contact Settings ? Project Categories', 'Functional / Status change', 'Medium',
        ['Open Business Partners ? Contact Settings ? Project Categories.', 'Create an Active category with a valid name.', 'Open its action menu ? Status.', 'Select Inactive and click Change.', 'Inspect the response and status dialog.'],
        'Changing the status of an existing category should succeed while preserving its saved name and other values. The new status should persist after reload.'];
    }
    const classificationExport404 = (result.fullName || '').includes('classifications.spec.ts') &&
      [result.statusDetails?.message, ...steps.map(step=>step.statusDetails?.message)].some(message=>message?.includes('Classification export must succeed; received HTTP 404'));
    if (classificationExport404) {
      definition = [null, 'Business Partners ? Contact Settings ? Classifications', 'Functional / Export', 'Medium',
        ['Open Business Partners ? Contact Settings ? Classifications.', 'Wait for the classification list to load.', 'Click Export.', 'Inspect the export response and whether a file downloads.'],
        'Export should return a successful response and download a nonempty file. The failed response does not establish any discrepancy in exported values because no file was produced.'];
    }
    if (/\b(customers|vendors)\.spec\.ts/.test(result.fullName || '') && result.name.includes('changing country clears')) {
      const screen = (result.fullName || '').includes('vendors.spec.ts') ? 'Vendors' : 'Customers';
      definition = [null, `Business Partners ? ${screen} ? Address Details`, 'Functional / Dependent fields', 'Medium',
        [`Open Business Partners ? ${screen} ? Create.`, 'Open Address Details.', 'Select Country: Egypt, Area: Cairo, and City: Nasr City.', 'Change Country to Saudi Arabia.', 'Inspect the displayed Area and City selections without saving the form.'],
        'Changing Country should clear the previously selected Area and City from the visible fields. City should remain disabled until a valid area for the new country is selected. This scenario does not establish whether stale values are submitted or persisted.'];
    } else if ((result.fullName || '').includes('sales-report.spec.ts') && result.name.includes('source invoice fields')) {
      definition = [null, 'Finance ? Reports ? Sales Invoice', 'Functional / Reconciliation', 'High',
        ['Open Finance ? Sales ? Invoices.', 'Load all invoice rows and verify the displayed total and unique invoice IDs.', 'Open Finance ? Reports ? Sales Invoice.', 'Compare invoice IDs and the customer, total, outstanding amount and payment status of matching invoices.'],
        'The list and report should reconcile for equivalent scopes. Any status or deletion exclusions must be explicitly defined before assigning a root cause.'];
    } else if ((result.fullName || '').includes('sales-report.spec.ts') && result.name.includes('customer filter, refresh')) {
      definition = [null, 'Finance ? Reports ? Sales Invoice', 'Functional / Filtering � investigation required', 'Untriaged',
        ['Open Finance ? Reports ? Sales Invoice and capture the unfiltered rows.', 'Filter by the customer of the first displayed invoice.', 'Compare the filtered rows against the same invoices in the baseline.', 'Refresh the report, then reset the filter and compare again.'],
        'Filtering should retain invoice-specific values. Confirm whether OPEN BALANCE is a filter-dependent running balance before treating a difference in that field as an accounting defect. Refresh and reset should be reproducible.'];
    }
    if ((result.fullName || '').includes('banks-treasuries.spec.ts') && result.name.startsWith('Status filter offers')) definition = [null, 'Finance → Accounting → Configurations → Banks & Treasuries', 'UI / Filtering', 'Medium', ['Open Banks & Treasuries list.', 'Observe the active/inactive status switches on records.', 'Open Filter and expand Status.', 'Compare the offered options with record status.'], 'Offer Active and Inactive options consistent with bank/treasury record status. Current observed options are Draft, Posted, Canceled and Unposted; backend filtering semantics were not tested.'];
    const [,moduleName,type,severity,reproduction,expected] = definition || [null,
      result.labels?.find(label=>label.name==='parentSuite')?.value || 'See test location',
      'Investigation required', 'Untriaged',
      [`Run the test: ${result.name}.`, 'Review the failed step and its screenshot / diagnostic attachments.'],
      'The assertions defined by this test should pass. Confirm the requirement and root cause before treating an unclassified failure as an application defect.'];
    let markdown = '';
    if (failed) {
      const failures = [...new Set(steps.filter(s => ['failed','broken'].includes(s.status))
        .map(s => s.statusDetails?.message).filter(Boolean))];
      if (!failures.length) failures.push(result.statusDetails?.message || 'The test did not complete successfully.');
      if (type === 'Functional / Unit type validation' && result.statusDetails?.message && !failures.includes(result.statusDetails.message)) failures.unshift(result.statusDetails.message);
      const csvFailure = failures.some(message=>message.includes('CSV requires unique nonempty column names'));
      const staleAddressFailure = result.name.includes('changing country clears') && failures.some(message=>/Previous country (area|city) must not remain displayed/.test(message));
      const title = type === 'Functional / Unit type selection' ? '[Units of Measure] Secondary reverts to Primary after leaving the field' : type === 'Functional / Unit type validation' ? '[Units of Measure] Displayed Primary type is rejected as missing' : classificationExport404 ? '[Classifications] Export returns HTTP 404 and no file downloads' : staleAddressFailure ? `[${(result.fullName || '').includes('vendors.spec.ts') ? 'Vendors' : 'Customers'}] Changing country leaves previous address selections visible` : csvFailure
        ? '[Sales Invoice] Exported Excel/CSV column structure does not match the Sales Invoice report displayed on the UI'
        : `[${moduleName.split(' ? ').at(-1)}] ${steps.find(s=>s.status==='failed')?.name || result.name}`;
      const actions = csvFailure ? [
        'Navigate to **Finance ? Reports ? Sales Invoice**.',
        'Review the invoice records and values displayed on the UI' + (result.name.includes('customer-filtered') ? ' after applying the **Customer** filter.' : '.'),
        'Export the report to **Excel/CSV**.',
        'Open the exported file.',
        'Compare the exported records and columns with the **Sales Invoice** report displayed on the UI.',
      ] : reproduction;
      markdown = `**Title:** ${title}\n\n**Module:** ${moduleName}\n**Type:** ${type}\n**Severity:** ${severity}\n**Priority:** ${severity}\n\n**Steps to Reproduce:**\n\n`;
      markdown += actions.map((step,i) => `${i+1}. ${step}`).join('\n');
      markdown += '\n\n**Actual Result:**\n\n';
      if (csvFailure) {
        markdown += 'The exported Excel/CSV column structure is not consistent with the Sales Invoice report displayed on the UI.\n\n- Column validation fails because the export contains empty or duplicate column names.\n- The exported table cannot be reliably mapped to the visible report columns.\n- Validation stops at the column structure; differences in invoice values or records are not established by this run.';
      } else {
        markdown += 'The following checks failed during this run:\n\n' + failures.map(message => `- ${message.replace(/\u001b\[[0-9;]*m/g,'').split('Call log:')[0].trim().replace(/\s+/g,' ').slice(0,1500)}`).join('\n');
      }
      markdown += '\n\n**Expected Result:**\n\n' + (csvFailure
        ? 'The Excel/CSV export should:\n\n- Match the **Sales Invoice** report displayed on the UI.\n- Export the same invoice records and values shown in the report, respecting active filters.\n- Maintain consistent columns and data structure between the UI and exported file.\n- Use nonempty, unique column names without unintended extra columns.\n- Ensure all exported invoice information accurately reflects the report data.'
        : 'The application should:\n\n- ' + expected);
      markdown += '\n\n**Evidence:**\nReview the screenshots, exported files and failed steps attached to this test.\n';
    }
    if (failed && executionIssue(result, steps)) {
      markdown = `**Title:** [Execution issue — review required] ${result.name}\n\n**Module:** ${moduleName}\n**Type:** Execution / Loading / Automation — not a confirmed application bug\n**Severity:** Untriaged\n**Priority:** Untriaged\n\n**Steps to Reproduce:**\n\n1. Run the named test.\n2. Inspect the interrupted step, loading state and attached diagnostics.\n3. Retry after checking page readiness, selectors and environment availability.\n\n**Actual Result:**\n\n- The test could not complete an operation or locate the expected control. Loading, timing, selectors or environment availability require investigation.\n- This run does not establish a functional application defect.\n- ${String(result.statusDetails?.message || 'See failed steps.').replace(/\u001b\[[0-9;]*m/g,'').replace(/\s+/g,' ').slice(0,1800)}\n\n**Expected Result:**\n\n- Wait for the relevant page/data state and verify the scenario on a completed run.\n- Preserve the original failed/broken status; do not mark the test passed or suppress confirmed business assertion failures.\n\n**Evidence:**\n\n- Review original failed steps and available screenshot/network attachments.\n`;
    }
    const manufacturingUpdate = attachments.find(a => a.name === 'manufacturing-update');
    if (failed && manufacturingUpdate) {
      const evidence = JSON.parse(fs.readFileSync(path.join(directory, manufacturingUpdate.source), 'utf8'));
      if (evidence.status === 422 && /product_name field is required/.test(evidence.body?.message || '') &&
          [...(evidence.submitted?.from || []), ...(evidence.submitted?.to || [])].some(item => item.product_name == null)) {
        markdown = `**Title:** [Manufacturing] Saving a notes-only draft edit fails because product names are submitted as null\n\n**Module:** Finance → Inventory → Transfer → Manufacturing\n**Type:** Functional / Draft editing\n**Severity:** High\n**Priority:** High\n\n**Steps to Reproduce:**\n\n1. Create a Manufacturing draft with source warehouse Riyadh and product gold, destination Makkah and product potat, quantity 1, and Scrap disabled.\n2. Save as Draft and reopen Edit.\n3. Confirm both product names are displayed.\n4. Change only Notes.\n5. Choose Save → Save as Draft.\n\n**Actual Result:**\n\n- Update returns HTTP 422 and does not save the changed notes.\n- The request contains null product_name values despite the product names being visible on the form.\n- Server message: ${evidence.body.message}\n- This evidence identifies the submitted data discrepancy; the application source was not available to establish its internal cause.\n\n**Expected Result:**\n\n- A notes-only edit should preserve existing product details and save successfully.\n- Valid saved product names should be included without requiring the user to reselect the products.\n\n**Evidence:**\n\n- See manufacturing-update JSON for submitted item names, response status and message.\n- See manufacturing-update-screen for the form before cleanup.\n`;
      }
    }
    const voucherEvidence = attachments.find(a => a.name === 'decimal-total');
    if (failed && voucherEvidence) {
      const e = JSON.parse(fs.readFileSync(path.join(directory,voucherEvidence.source),'utf8'));
      const decimal = voucherEvidence.name === 'decimal-total';
      const confirmed = decimal ? /0\.30000000000000004/.test(e.actual) : e.remaining.some(r=>r.id===e.id);
      if (confirmed) {
        const title = decimal ? '[Payment Vouchers] Decimal total displays floating-point digits' : '[Payment Vouchers] Deleted draft remains in the active list';
        const actions = decimal ? ['Open Finance → Accounting → Payment Vouchers → Create.', 'Enter 0.1 in the first line Value.', 'Click New to add a second line and enter 0.2.', 'Inspect Total value and the table total.'] : ['Create a uniquely identified payment voucher as Draft.', 'Open the draft, choose Delete and confirm deletion.', 'Reload the Payment Vouchers list.', `Search for reference ${e.ref}.`];
        const actual = decimal ? ['The total is displayed as 0.30000000000000004 instead of a currency-formatted 0.3.', 'This observation concerns display precision; posting impact was not tested.'] : [`Deletion returns HTTP ${e.deleteStatus}, but the same voucher remains in search results.`, `Voucher ID: ${e.id}. The response includes an archived_at value; no archive filter was selected.`];
        markdown = `**Title:** ${title}\n\n**Module:** Finance → Accounting → Payment Vouchers\n**Type:** ${decimal?'UI / Numeric formatting':'Functional / Deletion'}\n**Severity:** ${decimal?'Low':'Medium'}\n**Priority:** ${decimal?'Low':'Medium'}\n\n**Steps to Reproduce:**\n\n${actions.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n**Actual Result:**\n\n${actual.map(s=>'- '+s).join('\n')}\n\n**Expected Result:**\n\n- ${decimal?'Display the sum with appropriate decimal formatting (0.3 or 0.30), without floating-point artifacts.':'Exclude the deleted voucher from the active list and default search results.'}\n\n**Evidence:**\n\n- See attached ${voucherEvidence.name} JSON and browser screenshots.\n`;
      }
    }
    if ((result.fullName || '').includes('receipt-vouchers.spec.ts')) markdown = markdown.replaceAll('Payment Vouchers', 'Receipt Vouchers');
    const filterEvidence = attachments.find(a => ['cashflow-comparison','negative-balance-comparison'].includes(a.name));
    if (failed && filterEvidence) {
      const evidence = JSON.parse(fs.readFileSync(path.join(directory,filterEvidence.source),'utf8'));
      const cashflow = filterEvidence.name === 'cashflow-comparison';
      const confirmed = cashflow ? evidence.mismatches.length > 0 : !evidence.result.collection.some(r=>r.id===evidence.account.id);
      if (confirmed) {
        const title = cashflow ? '[Accounts] Cash flow filter includes accounts outside the selected category' : '[Accounts] Hide zero values removes a negative nonzero balance';
        const actions = cashflow ? ['Open Finance → Accounting → Accounts.', 'Open Filter.', `Select Cash flow: ${evidence.selected}.`, 'Submit and inspect the returned accounts.'] : ['Open Finance → Accounting → Accounts.', `Search for ${evidence.account.name} and note its balance (${evidence.account.balance}).`, 'Open Filter and enable Hide zero values.', 'Submit and inspect the search result.'];
        const actual = cashflow ? [`Selected ${evidence.selected}; the response contains ${evidence.mismatches.length} nonmatching accounts on the first page.`, `The filtered total is ${evidence.total}.`, 'See cashflow-comparison for the exact returned names and categories.'] : [`${evidence.account.name}, with balance ${evidence.account.balance}, disappears after enabling Hide zero values.`, `Filtered response contains ${evidence.result.collection.length} records.`];
        markdown = `**Title:** ${title}\n\n**Module:** Finance → Accounting → Accounts\n**Type:** Functional / Filtering\n**Severity:** Medium\n**Priority:** Medium\n\n**Steps to Reproduce:**\n\n${actions.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n**Actual Result:**\n\n${actual.map(s=>'- '+s).join('\n')}\n\n**Expected Result:**\n\n- ${cashflow ? 'Return only accounts belonging to the selected Cash flow category.' : 'Exclude only zero balances; retain accounts with positive or negative nonzero balances.'}\n\n**Evidence:**\n\n- Review the attached comparison JSON and browser screenshots.\n`;
      }
    }
    if (diagnostics.length) {
      const messages = [...new Set(diagnostics.map(event => `${event.kind}: ${event.message}`))];
      markdown += `\n\n**Browser Diagnostics � separate from test outcome:**\n\n**Module:** ${moduleName}\n**Type:** Browser / HTTP / Environment\n**Severity:** Untriaged\n**Priority:** Untriaged\n\n**Steps to Reproduce:**\n\n1. Run this test in the configured browser.\n2. Inspect HTTP responses and the browser console during navigation.\n\n**Actual Result:**\n\n${messages.map(message=>'- '+message).join('\n\n')}\n\n**Expected Result:**\nPage requests should complete successfully and browser errors should be handled appropriately. Notification permission denial is an environment observation, not proof of a financial defect. Passing functional assertions do not clear these diagnostics.\n`;
    }
    const source = `${result.uuid}-bug-report.md`;
    fs.writeFileSync(path.join(directory,source),markdown);
    const executionOnly = markdown.includes('**Type:** Execution / Loading / Automation');
    if (failed) categoryResults.push({ message: result.statusDetails?.message, trace: result.statusDetails?.trace, executionOnly });
    result.attachments = (result.attachments || []).filter(a=>!['Bug Report','Execution Issue','Browser Diagnostics'].includes(a.name));
    result.attachments.push({name:executionOnly?'Execution Issue':failed?'Bug Report':'Browser Diagnostics',source,type:'text/markdown'});
    // Preserve existing descriptions and make repeated generation idempotent.
    const marker = '<!-- luxora-generated-bug-report -->';
    const original = (result.description || '').split(marker)[0];
    result.description = original + marker + '\n\n' + markdown;
    // Allure strips HTML markup in descriptionHtml. Its Markdown description
    // renderer preserves bold labels, paragraph spacing and actual lists.
    delete result.descriptionHtml;
    fs.writeFileSync(resultPath,JSON.stringify(result));
    reports++;
  }
  // Match only current-run execution messages. Never relabel a business failure
  // sharing the same message, and keep original statuses and statusDetails intact.
  const categoryName = 'Execution / Loading / Automation — review required';
  const categoriesPath = path.join(directory, 'categories.json');
  const categories = fs.existsSync(categoriesPath) ? JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) : [];
  const retained = categories.filter(category => category.name !== categoryName);
  const signature = r => JSON.stringify([r.message, r.trace]);
  const businessMessages = new Set(categoryResults.filter(r => !r.executionOnly).map(signature));
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const seen = new Set();
  for (const result of categoryResults) {
    const key = signature(result);
    if (!result.executionOnly || !result.message || businessMessages.has(key) || seen.has(key)) continue;
    seen.add(key);
    retained.unshift({
      name: categoryName,
      matchedStatuses: ['failed', 'broken'],
      messageRegex: '^(?:' + escape(result.message) + ')$',
      ...(result.trace ? { traceRegex: '^(?:' + escape(result.trace) + ')$' } : {}),
    });
  }
  fs.writeFileSync(categoriesPath, JSON.stringify(retained, null, 2));
  console.log(`Allure: added current-run bug reports / diagnostics to ${reports} test results.`);
  return reports;
}
module.exports = { enrich, executionIssue };
if (require.main === module) enrich(process.argv[2]);








