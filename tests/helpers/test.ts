import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export type { Locator, Page } from '@playwright/test';

// Keep diagnostics in the test report without recording request bodies or tokens.
export const test = base.extend<{ browserDiagnostics: void }>({
  browserDiagnostics: [async ({ page }, use, testInfo) => {
    const events: { kind: string; message: string }[] = [];
    const safeURL = (value: string) => {
      const url = new URL(value);
      return `${url.origin}${url.pathname}`;
    };
    page.on('pageerror', error => events.push({ kind: 'pageerror', message: error.message }));
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) {
        events.push({ kind: `console.${message.type()}`, message: message.text() });
      }
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        events.push({ kind: 'http', message: `${response.status()} ${safeURL(response.url())}` });
      }
    });
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
        events.push({ kind: 'network', message: `${request.failure()?.errorText} ${safeURL(request.url())}` });
      }
    });
    await use();
    await testInfo.attach('browser-diagnostics', {
      body: JSON.stringify(events, null, 2), contentType: 'application/json',
    });
  }, { auto: true }],
});
