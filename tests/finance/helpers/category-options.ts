import { expect, Page } from '../../helpers/test';

/** The category dropdown loads pages on scroll; typing does not search its API. */
export async function revealCategoryOption(page: Page, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const option = page.getByRole('option', {name: new RegExp(`^${escaped}(?: #[0-9]+)?$`)});
  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:/#[0-9]+$/}).first()).toBeVisible();
  for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
    if (await option.count()) break;
    const before = await page.getByRole('option').count();
    const pending = page.waitForResponse(r => r.request().method() === 'GET'
      && new URL(r.url()).pathname.endsWith('/all_product_categories'));
    await list.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const response = await pending;
    expect(response.ok()).toBeTruthy();
    const data = (await response.json()).data;
    if (data.collection.length)
      await expect.poll(() => page.getByRole('option').count()).toBeGreaterThan(before);
    if (data.meta.current_page >= data.meta.last_page) break;
  }
  await expect(option).toBeVisible();
}
