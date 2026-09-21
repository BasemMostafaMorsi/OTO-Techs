import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Contact attachments', () => {
  test('@regression file picker only accepts supported images and documents', async ({ page }) => {
    await login(page);
    await page.goto('/en/contacts/contacts/create?tab=attachments');

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    const accept = (await fileInput.getAttribute('accept')) ?? '';
    expect(accept, 'The file input must define accepted formats').not.toBe('');
    expect(accept).toMatch(/image\//i);
    expect(accept).toMatch(/pdf|document|msword|officedocument|\.docx?/i);
    expect(accept).not.toMatch(/application\/\*|\*\/\*/i);
  });
});
