import { test, expect } from '../helpers/test';
import { login } from '../helpers/auth';

// Controlled browser checks: all requests are fulfilled locally; no ERP writes.
for (const recover of [true, false]) {
  test(`login readiness ${recover ? 'recovers one unavailable page' : 'preserves failure after bounded recovery'}`, async ({ page }) => {
    test.setTimeout(60_000);
    const previous = { email: process.env.LUXORA_EMAIL, password: process.env.LUXORA_PASSWORD };
    process.env.LUXORA_EMAIL = 'readiness@example.test';
    process.env.LUXORA_PASSWORD = 'local-fixture-only';
    let loads = 0;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/en/login') loads++;
      const ready = recover && loads === 2;
      await route.fulfill({ contentType: 'text/html', body: url.pathname === '/en/login'
        ? ready ? '<label>Email<input type="email"></label><label>Password<input type="password"></label><button onclick="location.href=\'/en/home\'">Login</button>' : '<h1>Temporarily unavailable</h1>'
        : '<h1>Home</h1>' });
    });
    try {
      if (recover) {
        await login(page);
        await expect(page).toHaveURL(/\/en\/home$/);
      } else {
        await expect(login(page)).rejects.toThrow('Login readiness failed after two page loads');
      }
      expect(loads).toBe(2);
      await page.screenshot({ path: `artifacts/login-recovery-${recover ? 'success' : 'unavailable'}.png` });
    } finally {
      if (previous.email === undefined) delete process.env.LUXORA_EMAIL;
      else process.env.LUXORA_EMAIL = previous.email;
      if (previous.password === undefined) delete process.env.LUXORA_PASSWORD;
      else process.env.LUXORA_PASSWORD = previous.password;
    }
  });
}
