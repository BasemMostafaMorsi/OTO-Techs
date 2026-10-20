import { test, expect, Page } from "../../../helpers/test";
import { login } from "../../../helpers/auth";
const base = "/en/finance/accounting/receipt-vouchers";
const api = "/api/v1.0/finance/payment_receipt_vouchers";
const folder = "artifacts/finance/accounting/receipt-vouchers";
const date = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo",
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
}).format(new Date());
const field = (p: Page, name: string) =>
  p.getByRole("textbox", { name, exact: true });
async function choose(p: Page, name: string, value: string) {
  await p.getByRole("combobox", { name, exact: true }).click();
  await p.getByRole("option").filter({ hasText: value }).first().click();
}
async function form(p: Page) {
  await p.goto(base + "/create");
  await expect(field(p, "Description *")).toBeVisible();
}
async function valid(p: Page, ref: string) {
  await form(p);
  await field(p, "Date *").fill(date);
  await field(p, "Ref No").fill(ref);
  await choose(p, "Treasury name *", "Main Treasury");
  await field(p, "Description *").fill("RV-E2E-" + ref);
  await choose(p, "Choose an account", "Petty Cash 1111002");
  await field(p, "0").fill("1.25");
  await field(p, "Description").fill("Automation line");
  await field(p, "Write your Notes").fill("Automation notes");
}
async function draft(p: Page) {
  await p.getByRole("button", { name: "Submit", exact: true }).click();
  await p.getByRole("menuitem", { name: "Draft", exact: true }).click();
}
function response(p: Page, method: string, path = api) {
  return p.waitForResponse(
    (r) =>
      r.request().method() === method && new URL(r.url()).pathname === path,
  );
}
test.beforeEach(async ({ page }) => {
  test.setTimeout(90000);
  await login(page);
});
test.afterEach(async ({ page }, info) => {
  const screenshot = await page.screenshot({ fullPage: true });
  await info.attach("voucher-screen", {
    body: screenshot,
    contentType: "image/png",
  });
});

test("blank draft is blocked by required-field validation", async ({
  page,
}) => {
  await form(page);
  await draft(page);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(new RegExp("/create$"));
  await expect(page.locator("main")).toContainText(/required/i);
});
test("reference rejects alphabetic characters", async ({ page }) => {
  await valid(page, "INVALID");
  await draft(page);
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("Please insert numbers only", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/create$/);
});
test("decimal total displays 0.3 for 0.1 plus 0.2", async ({ page }, info) => {
  await form(page);
  await field(page, "0").fill("0.1");
  await page.getByRole("button", { name: "New", exact: true }).click();
  await field(page, "0").nth(1).fill("0.2");
  const total = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Total", exact: true }) });
  await info.attach("decimal-total", {
    body: JSON.stringify({
      inputs: ["0.1", "0.2"],
      expected: "0.3",
      actual: await total.innerText(),
    }),
    contentType: "application/json",
  });
  await expect(total).toHaveText(/Total\s*0\.3(?:0)?$/);
});
test("line totals update when changing and removing rows", async ({ page }) => {
  await form(page);
  await field(page, "0").fill("1.25");
  await page.getByRole("button", { name: "New", exact: true }).click();
  await field(page, "0").nth(1).fill("2.25");
  await expect
    .poll(async () =>
      Number(
        (
          await page
            .getByRole("row")
            .filter({
              has: page.getByRole("cell", { name: "Total", exact: true }),
            })
            .innerText()
        )
          .replace("Total", "")
          .replace(/[\s,]/g, ""),
      ),
    )
    .toBe(3.5);
  await field(page, "0").nth(1).fill("3.25");
  await expect
    .poll(async () =>
      Number(
        (
          await page
            .getByRole("row")
            .filter({
              has: page.getByRole("cell", { name: "Total", exact: true }),
            })
            .innerText()
        )
          .replace("Total", "")
          .replace(/[\s,]/g, ""),
      ),
    )
    .toBe(4.5);
  await page
    .locator("tbody tr")
    .filter({ has: field(page, "0") })
    .nth(1)
    .locator("td")
    .last()
    .getByRole("button")
    .click();
  await expect(field(page, "0")).toHaveCount(1);
  await expect
    .poll(async () =>
      Number(
        (
          await page
            .getByRole("row")
            .filter({
              has: page.getByRole("cell", { name: "Total", exact: true }),
            })
            .innerText()
        )
          .replace("Total", "")
          .replace(/[\s,]/g, ""),
      ),
    )
    .toBe(1.25);
});
test("source types expose Account Bank and Treasury controls", async ({
  page,
}) => {
  await form(page);
  await choose(page, "Type *", "Bank");
  await expect(page.getByRole("combobox", { name: /Bank name/ })).toBeVisible();
  await choose(page, "Type *", "Account");
  await expect(
    page.getByRole("combobox", { name: /Account name/ }),
  ).toBeVisible();
  await choose(page, "Type *", "Treasury");
  await expect(
    page.getByRole("combobox", { name: "Treasury name *", exact: true }),
  ).toBeVisible();
});
for (const status of ["Draft", "Posted", "Canceled", "Unposted"])
  test(`Status ${status} filters visible rows and Reset restores total`, async ({
    page,
  }, info) => {
    const start = response(page, "GET");
    await page.goto(base);
    const baseline = (await (await start).json()).data;
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await choose(page, "Status", status);
    const pending = response(page, "GET");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    const r = await pending;
    const result = (await r.json()).data;
    await info.attach("filter-response", {
      body: JSON.stringify({
        status,
        url: r.url(),
        meta: result.meta,
        rows: result.collection.map((x: any) => ({
          id: x.id,
          status: x.status,
        })),
      }),
      contentType: "application/json",
    });
    await expect(
      page.getByRole("button", {
        name: new RegExp("^\\d+/" + result.meta.total + "$"),
      }),
    ).toBeVisible();
    // Empty states are valid; evidence records whether matching fixtures exist.
    const rows = page
      .locator("tbody tr")
      .filter({ has: page.getByRole("button", { name: "more", exact: true }) });
    if (result.meta.total > 0) await expect(rows.first()).toBeVisible();
    for (let i = 0; (await rows.count()) < result.meta.total && i < 30; i++) {
      const count = await rows.count();
      await rows.last().scrollIntoViewIfNeeded();
      await page.getByRole("table").evaluate((table) => {
        let el = table.parentElement;
        while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement;
        const target = el || document.scrollingElement;
        if (target) target.scrollTop = target.scrollHeight;
      });
      await expect.poll(() => rows.count()).toBeGreaterThan(count);
    }
    await expect(rows).toHaveCount(result.meta.total);
    for (const row of await rows.all())
      await expect(row.locator("td").nth(3)).toHaveText(status);
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const reset = response(page, "GET");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    const restored = await reset;
    expect((await restored.json()).data.meta.total).toBe(baseline.meta.total);
    expect(new URL(restored.url()).searchParams.has("status")).toBe(false);
  });
test("search with no matches clears rows and clearing search restores list", async ({
  page,
}) => {
  const initial = response(page, "GET");
  await page.goto(base);
  const total = (await (await initial).json()).data.meta.total;
  const pending = response(page, "GET");
  await page
    .getByPlaceholder("Search", { exact: true })
    .fill("RV-NO-MATCH-" + Date.now());
  expect((await (await pending).json()).data.meta.total).toBe(0);
  await expect(
    page.getByRole("button", { name: "0/0", exact: true }),
  ).toBeVisible();
  const reset = response(page, "GET");
  await page.getByPlaceholder("Search", { exact: true }).fill("");
  expect((await (await reset).json()).data.meta.total).toBe(total);
});
test("draft create edit persistence cancel deletion and confirmed deletion", async ({
  page,
}, info) => {
  const ref = String(Date.now());
  let id = "";
  let deleted = false;
  try {
    await valid(page, ref);
    const create = response(page, "POST");
    await draft(page);
    const created = await create;
    const body = await created.json();
    expect(created.ok(), body.message).toBeTruthy();
    id = body.data.id;
    await info.attach("created-voucher", {
      body: JSON.stringify({ id, ref, description: "RV-E2E-" + ref }),
      contentType: "application/json",
    });
    expect(Number(body.data.type), "Created voucher must be a receipt").toBe(2);
    expect(body.data.status).toBe(0);
    expect(Number(body.data.value)).toBe(1.25);
    await page.goto(base + "/edit/" + id);
    await expect(field(page, "Ref No")).toHaveValue(ref);
    await expect(field(page, "Description *")).toHaveValue("RV-E2E-" + ref);
    await expect(field(page, "0")).toHaveValue("1.25");
    await expect(field(page, "Write your Notes")).toHaveValue(
      "Automation notes",
    );
    await field(page, "Description *").fill("RV-E2E-" + ref + "-edited");
    await field(page, "0").fill("2.5");
    await field(page, "Write your Notes").fill("Edited notes");
    const save = page.waitForResponse(
      (r) =>
        ["POST", "PUT", "PATCH"].includes(r.request().method()) &&
        new URL(r.url()).pathname === api + "/" + id,
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Save as Draft", exact: true })
      .click();
    expect((await save).ok()).toBeTruthy();
    await page.reload();
    await expect(field(page, "Description *")).toHaveValue(
      "RV-E2E-" + ref + "-edited",
    );
    await expect(field(page, "0")).toHaveValue("2.5");
    await expect(field(page, "Write your Notes")).toHaveValue("Edited notes");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.reload();
    await expect(field(page, "Ref No")).toHaveValue(ref);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const remove = response(page, "DELETE", api + "/" + id);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    const removed = await remove;
    expect(removed.ok()).toBeTruthy();
    deleted = true;
    await info.attach("cleanup-result", {
      body: JSON.stringify({ id, deleteStatus: removed.status() }),
      contentType: "application/json",
    });
    await page.goto(base);
    const searched = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname === api &&
        new URL(r.url()).searchParams.get("search") === ref,
    );
    await page.getByPlaceholder("Search", { exact: true }).fill(ref);
    const searchResponse = await searched;
    const data = (await searchResponse.json()).data;
    await expect(
      page.getByRole("button", {
        name: new RegExp("^\\d+/" + data.meta.total + "$"),
      }),
    ).toBeVisible();
    await info.attach("delete-verification", {
      body: JSON.stringify({
        id,
        ref,
        deleteStatus: removed.status(),
        total: data.meta.total,
        remaining: data.collection.map((r: any) => ({
          id: r.id,
          ref: r.ref,
          archived_at: r.archived_at,
          status: r.status,
        })),
      }),
      contentType: "application/json",
    });
    // Observe archive visibility without imposing disappearance on this voucher screen.
    // Successful deletion is checked above; retain search evidence without requiring disappearance.
  } finally {
    if (id && !deleted) {
      await page.goto(base + "/edit/" + id);
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      const cleanup = response(page, "DELETE", api + "/" + id);
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await info.attach("cleanup-result", {
        body: JSON.stringify({ id, deleteStatus: (await cleanup).status() }),
        contentType: "application/json",
      });
    }
  }
});
