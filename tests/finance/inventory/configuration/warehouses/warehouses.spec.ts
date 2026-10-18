import { test, expect, Page } from "../../../../helpers/test";
import { login } from "../../../../helpers/auth";

const route = "/en/finance/inventory/configuration/warehouses";
const api = "/api/v1.0/inventory/warehouses";
const rows = (p: Page) =>
  p.locator("tbody tr").filter({ has: p.getByRole("checkbox") });
const ids = (data: any[]) => data.map((r) => r.id).sort((a, b) => a - b);
function response(p: Page) {
  return p
    .waitForResponse(
      (r) =>
        r.request().method() === "GET" && new URL(r.url()).pathname === api,
      { timeout: 60000 },
    )
    .then(async (r) => {
      expect(r.ok()).toBeTruthy();
      return (await r.json()).data;
    });
}
async function open(p: Page) {
  await p.goto("about:blank");
  const pending = response(p);
  const [data] = await Promise.all([
    pending,
    p.goto(route, { waitUntil: "domcontentloaded", timeout: 60000 }),
  ]);
  await match(p, data);
  return data.collection;
}
async function match(p: Page, data: any) {
  expect(
    data.meta.last_page,
    "Expand pagination coverage when fixture exceeds one page",
  ).toBe(1);
  await expect(rows(p)).toHaveCount(data.meta.total);
  for (const item of data.collection) {
    const row = rows(p).filter({
      has: p.getByText("#" + item.id, { exact: true }),
    });
    await expect(row.getByRole("cell").nth(1)).toContainText(item.name);
    await expect(row.getByRole("cell").nth(2)).toHaveText(
      item.country.locale_country_translates.name,
    );
    await expect(row.getByRole("cell").nth(3)).toHaveText(
      item.city.locale_city_translates.name,
    );
    await expect(row.getByRole("cell").nth(4)).toHaveText(
      item.area.locale_area_translates.name,
    );
    await expect(row.getByRole("checkbox").nth(1)).toBeChecked({
      checked: Boolean(item.status),
    });
  }
}
async function choose(p: Page, label: string | RegExp, value: string) {
  await p
    .getByRole("combobox", { name: label, exact: typeof label === "string" })
    .click();
  await p.getByRole("option").filter({ hasText: value }).first().click();
  await p.keyboard.press("Escape");
}
async function search(p: Page, text: string) {
  const pending = response(p);
  await p.getByPlaceholder("Search", { exact: true }).fill(text);
  const data = await pending;
  await match(p, data);
  return data.collection;
}
test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
});
test.afterEach(async ({ page }, info) => {
  const screenshot = await page.screenshot({ fullPage: true });
  await info.attach("warehouses-screen", {
    body: screenshot,
    contentType: "image/png",
  });
});

test("list fields status and record count match source", async ({
  page,
}, info) => {
  const baseline = await open(page);
  await info.attach("warehouse-baseline", {
    body: JSON.stringify(baseline),
    contentType: "application/json",
  });
});
test("name search no-match and clear restore records", async ({ page }) => {
  const baseline = await open(page);
  expect(baseline.length).toBeGreaterThan(0);
  const found = await search(page, baseline[0].name);
  expect(ids(found)).toEqual(
    ids(baseline.filter((r: any) => r.name.includes(baseline[0].name))),
  );
  expect(await search(page, "NO-WH-" + Date.now())).toHaveLength(0);
  expect(ids(await search(page, ""))).toEqual(ids(baseline));
});
for (const status of ["Active", "Inactive"])
  test("status " + status + " and Reset", async ({ page }, info) => {
    const baseline = await open(page);
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await choose(page, "Status", status);
    const pending = response(page);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    const data = await pending;
    await match(page, data);
    await info.attach("filtered-source", {
      body: JSON.stringify(data),
      contentType: "application/json",
    });
    expect
      .soft(ids(data.collection))
      .toEqual(
        ids(
          baseline.filter(
            (r: any) => Boolean(r.status) === (status === "Active"),
          ),
        ),
      );
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const reset = response(page);
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    const restored = await reset;
    await match(page, restored);
    expect(ids(restored.collection)).toEqual(ids(baseline));
  });
for (const depth of [1, 2, 3])
  test(
    "address filter depth " + depth + " matches source",
    async ({ page }, info) => {
      const baseline = await open(page);
      await page.getByRole("button", { name: "Filter", exact: true }).click();
      await choose(page, "Country", "Egypt");
      if (depth >= 2) await choose(page, "Area", "Cairo");
      if (depth >= 3) await choose(page, "City", "Al Azbakeyah");
      const pending = response(page);
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      const data = await pending;
      await match(page, data);
      await info.attach("address-filter-source", {
        body: JSON.stringify({ baseline, filtered: data }),
        contentType: "application/json",
      });
      expect(ids(data.collection)).toEqual(
        ids(
          baseline.filter(
            (r: any) =>
              r.country_id === 1 &&
              (depth < 2 || r.city_id === 1) &&
              (depth < 3 || r.area_id === 2),
          ),
        ),
      );
    },
  );
test("warehouse keeper filter matches source", async ({ page }, info) => {
  const baseline = await open(page);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await choose(page, "Warehouse keeper", "new emp");
  const pending = response(page);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const data = await pending;
  await match(page, data);
  await info.attach("keeper-filter", {
    body: JSON.stringify(data),
    contentType: "application/json",
  });
  expect(ids(data.collection)).toEqual(
    ids(
      baseline.filter((r: any) =>
        r.warehouse_keepers.some((k: any) => k.name === "new emp"),
      ),
    ),
  );
});
test("cancel filter preserves list", async ({ page }) => {
  const baseline = await open(page);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await choose(page, "Status", "Inactive");
  await page.getByRole("button", { name: "close", exact: true }).click();
  await expect(rows(page)).toHaveCount(baseline.length);
});
test("blank create validates required fields", async ({ page }) => {
  await page.goto(route + "/create");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  for (const text of [
    "Warehouse keepers field is required",
    "Country is required",
    "Area is required",
    "City is required",
    "Address is required",
  ])
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.getByText("Name is required", { exact: true })).toHaveCount(
    2,
  );
  await expect(page).toHaveURL(new RegExp("/warehouses/create$"));
});
test("changing country clears dependent area and city", async ({ page }) => {
  await page.goto(route + "/create");
  await expect(page.getByRole("combobox", { name: /^Area/ })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: /^City/ })).toBeDisabled();
  await choose(page, /^Country/, "Egypt");
  await choose(page, /^Area/, "Cairo");
  await choose(page, /^City/, "Al Azbakeyah");
  await choose(page, /^Country/, "Saudi Arabia");
  await expect(page.getByRole("combobox", { name: /^Area/ })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: /^City/ })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: /^City/ })).toBeDisabled();
});
test("owned warehouse creation persists all entered fields", async ({
  page,
}, info) => {
  const name = "WH-E2E-" + Date.now();
  await page.goto(route + "/create");
  await page.getByRole("textbox", { name: "Name *", exact: true }).fill(name);
  await choose(page, /^Warehouse Keepers/, "new emp");
  await choose(page, /^Country/, "Egypt");
  await choose(page, /^Area/, "Cairo");
  await choose(page, /^City/, "Al Azbakeyah");
  await page
    .getByRole("textbox", { name: "Short number *", exact: true })
    .fill(String(Date.now()).slice(-8));
  await page
    .getByRole("textbox", { name: "Address *", exact: true })
    .fill("Automation test warehouse");
  await page
    .getByRole("textbox", { name: "Landmark", exact: true })
    .fill("E2E landmark");
  await expect(
    page.getByRole("checkbox", { name: "Set As Main Warehouse", exact: true }),
  ).not.toBeChecked();
  const saved = page
    .waitForResponse(
      (r) =>
        r.request().method() === "POST" && new URL(r.url()).pathname === api,
    )
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const result = await saved;
  await info.attach("created-warehouse", {
    body: JSON.stringify({ name, ...result }),
    contentType: "application/json",
  });
  expect(result.status).toBeLessThan(300);
  await open(page);
  const found = await search(page, name);
  expect(found).toHaveLength(1);
  expect(found[0]).toMatchObject({
    name,
    address: "Automation test warehouse",
    landmark: "E2E landmark",
    country_id: 1,
    city_id: 1,
    area_id: 2,
    is_main: false,
  });
  expect(
    found[0].warehouse_keepers.some((k: any) => k.name === "new emp"),
  ).toBe(true);
});
