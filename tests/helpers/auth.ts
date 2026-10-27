import { expect, Page, test } from '@playwright/test';

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

  const emailField = page
    .getByLabel(/email|البريد/i)
    .or(page.locator('input[type="email"]'))
    .first();
  const passwordField = page
    .getByLabel(/password|كلمة المرور/i)
    .or(page.locator('input[type="password"]'))
    .first();

  // Retry only loading the login form, never submitted credentials or business actions.
  // Keep recovered attempts visible instead of turning a shared outage into vague fill timeouts.
  for (let attempt = 1; attempt <= 2; attempt++) {
    let status: number | undefined;
    try {
      const response = await page.goto('/en/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      status = response?.status();
      await expect(emailField, 'Login email field must be ready').toBeEditable({ timeout: 10_000 });
      await expect(passwordField, 'Login password field must be ready').toBeEditable({ timeout: 10_000 });
      break;
    } catch (error) {
      const url = new URL(page.url());
      await test.info().attach('login-readiness-attempt-' + attempt, {
        body: JSON.stringify({ attempt, status, url: url.origin + url.pathname, message: 'Login form unavailable before credential submission' }),
        contentType: 'application/json',
      });
      if (attempt === 2) throw new Error('Login readiness failed after two page loads; execution/environment investigation required.', { cause: error });
      // Give recovery its own bounded budget without consuming the business scenario budget.
      test.info().setTimeout(test.info().timeout + 35_000);
    }
  }

  await emailField.fill(email);
  await passwordField.fill(password);
  await page.getByRole('button', { name: /login|sign in|دخول|تسجيل الدخول/i }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}
