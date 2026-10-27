// Keep missing context explicit; never infer a role, URL or root cause.
function formatBugReport(markdown, executionOnly = false) {
  const boundary = markdown.indexOf('**Steps to Reproduce:**');
  if (boundary < 0) return markdown;
  const header = markdown.slice(0, boundary).trim().replace(/\n(?=\*\*)/g, '\n\n');
  const context = '**Environment:** Power Vision ERP – Web\n\n' +
    '**URL:** See the navigation steps and attached browser evidence.\n\n' +
    '**User Role:** Configured test account; role not independently verified.\n\n' +
    '**Preconditions:**\n\n- Use the configured test environment and account.\n- Use the records and settings documented in the test steps and attachments.\n\n';
  const review = '**Impact:**\n\n- ' + (executionOnly
    ? 'Execution was interrupted; functional behavior could not be verified.'
    : 'The behavior described in Actual Result did not meet the test expectation. Wider business impact requires review.') +
    '\n\n**Team Responsible:** ' + (executionOnly ? 'QA Automation / Environment investigation' : 'Pending evidence review; application ownership is not yet established.') +
    '\n\n**Reason:** ' + (executionOnly ? 'Investigate readiness, selectors and environment before classifying an application defect.' : 'The observed discrepancy is documented below. The internal root cause has not been established.') + '\n\n';
  return header + '\n\n' + context + markdown.slice(boundary).replace('**Evidence:**', review + '**Evidence:**');
}
module.exports = { formatBugReport };
