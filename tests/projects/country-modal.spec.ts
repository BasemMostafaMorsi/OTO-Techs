import { test, expect } from '../helpers/test';
import { login } from '../helpers/auth';

test.describe('Project country modal', () => {
  test('@regression modal has a title, field label, and working translation action', async ({
    page,
  }) => {
    test.info().annotations.push({ type: 'known-issue', description: 'Country title and label are fixed; the translation action is absent.' });

    await login(page);
    await page.goto('/en/contacts/projects/create');

    const country = page.getByRole('combobox', { name: 'Country', exact: true });
    await country.click();
    await page.getByText('Create new', { exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Add Country' })).toBeVisible();
    await expect(dialog.getByLabel('Country Name')).toBeVisible();

    const translationButton = dialog.getByRole('button', {
      name: /translation|language/i,
    });
    await expect(translationButton).toBeEnabled();
    await translationButton.click();

    await expect(
      dialog.getByRole('textbox', { name: /arabic|العربية/i }),
    ).toBeVisible();
  });
});
