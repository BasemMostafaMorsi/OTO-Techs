import { expect, Page } from '@playwright/test';

declare const process: {
  env: Record<string, string | undefined>;
};

export async function login(page: Page) {
  const email = process.env.LUXORA_EMAIL;
  const password = process.env.LUXORA_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Set LUXORA_EMAIL and LUXORA_PASSWORD before running authenticated tests.',
    );
  }

  await page.goto('/en/login');

  const emailField = page
    .getByLabel(/email|البريد/i)
    .or(page.locator('input[type="email"]'))
    .first();
  const passwordField = page
    .getByLabel(/password|كلمة المرور/i)
    .or(page.locator('input[type="password"]'))
    .first();

  await emailField.fill(email);
  await passwordField.fill(password);
  await page.getByRole('button', { name: /login|sign in|دخول|تسجيل الدخول/i }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}
