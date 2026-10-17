import {expect, Page} from '@playwright/test';

// Leave the previous document before subscribing: its pending list requests can
// otherwise satisfy the next navigation's wait and lose their response body.
export async function openList(page: Page, path: string, api: string) {
  await page.goto('about:blank');
  const body = page.waitForResponse(response => {
    const url = new URL(response.url());
    return response.request().method() === 'GET' &&
      url.pathname === '/api/v1.0' + api &&
      !url.searchParams.get('search') && !url.searchParams.get('status') &&
      !url.searchParams.get('type') && ['1', null].includes(url.searchParams.get('page'));
  }).then(async response => {
    expect(response.ok(), `List response HTTP ${response.status()}`).toBeTruthy();
    return (await response.json()).data;
  });
  const [data] = await Promise.all([body, page.goto(path, {waitUntil: 'domcontentloaded'})]);
  await expect(page.getByRole('button', {name: new RegExp(`^\\d+/${data.meta.total}$`)})).toBeVisible();
  return data;
}
