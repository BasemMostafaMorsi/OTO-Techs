import { test, expect, Page } from "../../../../helpers/test";
import { login } from "../../../../helpers/auth";
const { mkdir, readFile, writeFile } = eval("require")("node:fs/promises");

const route = "/en/finance/inventory/configuration/additional-items";
const api = "/api/v1.0/additional_items";
const folder = "artifacts/finance/inventory/configuration/additional-items";
const tags = [
  "Receipts",
  "Deliveries",
  "Internal Transfer",
  "Manufacturing",
  "Scrap",
  "Stocktaking",
];
type Item = {
  id: number;
  name: string;
  description: string | null;
  module_id: number[];
};
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
const field = (p: Page, name: string) =>
  p.getByRole("textbox", { name, exact: true });
const rows = (p: Page) =>
  p.locator("tbody tr").filter({ has: p.getByRole("checkbox") });
const row = (p: Page, name: string) =>
  rows(p).filter({ has: p.getByText(name, { exact: true }) });
const ids = (items: Item[]) =>
  items.map((item) => item.id).sort((a, b) => a - b);
const evidence = (name: string, data: unknown) =>
  test
    .info()
    .attach(name, {
      body: JSON.stringify(data),
      contentType: "application/json",
    });

function response(p: Page, method = "GET", path = api) {
  return p.waitForResponse(
    (r) =>
      r.request().method() === method && new URL(r.url()).pathname === path,
    { timeout: 60000 },
  );
}
async function source(pending: ReturnType<typeof response>) {
  const res = await pending,
    body = await res.json();
  await evidence("inventory-additional-response", {
    method: res.request().method(),
    query: new URL(res.url()).search,
    status: res.status(),
    body,
  });
  expect(res.ok(), JSON.stringify(body)).toBeTruthy();
  expect(body.is_success).toBe(true);
  const module = new URL(res.url()).searchParams.get("module_id");
  return { ...body.data, moduleId: module ? Number(module) : null };
}
async function match(p: Page, data: { collection: Item[] }) {
  await expect(rows(p)).toHaveCount(data.collection.length);
  for (const item of data.collection)
    await expect(row(p, item.name)).toBeVisible();
}
async function open(p: Page) {
  await p.goto("about:blank");
  const pending = source(response(p));
  const [data] = await Promise.all([
    pending,
    p.goto(route, { waitUntil: "domcontentloaded", timeout: 60000 }),
  ]);
  await expect(button(p, "Create")).toBeVisible();
  await match(p, data);
  return data;
}
async function search(p: Page, term: string) {
  const pending = source(response(p));
  await p.getByPlaceholder("Search", { exact: true }).fill(term);
  const data = await pending;
  await match(p, data);
  return data;
}
async function create(p: Page) {
  await button(p, "Create").click();
  await expect(field(p, "Name *")).toBeVisible();
}
async function choose(p: Page, name: string, filter = false) {
  await p
    .getByRole("combobox", { name: filter ? "Tags" : "Tags *", exact: true })
    .click();
  await p.getByRole("option", { name, exact: true }).click();
  await p.keyboard.press("Escape");
}
async function action(p: Page, name: string, label: "Edit" | "Delete") {
  const icon = label === "Edit" ? "edit" : "trash";
  await row(p, name)
    .getByRole("button")
    .filter({ has: p.locator(`i.tabler-${icon}`) })
    .click();
}
async function remove(p: Page, name: string, id: string) {
  await action(p, name, "Delete");
  const pending = source(response(p, "DELETE", `${api}/${id}`));
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  return pending;
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
});
test.afterEach(async ({ page }, info) => {
  await mkdir(folder, { recursive: true });
  const path = `${folder}/${info.title.replace(/[^a-z0-9]+/gi, "-")}.png`;
  try {
    await page.screenshot({ path, fullPage: true, timeout: 10000 });
    await info.attach("inventory-additional-screen", {
      path,
      contentType: "image/png",
    });
  } catch (error) {
    await info.attach("screenshot-diagnostic", {
      body: String(error),
      contentType: "text/plain",
    });
  }
});

test("list names and count match source", async ({ page }) => {
  await open(page);
});
test("existing name no-match search and clear", async ({ page }) => {
  const baseline = await open(page);
  test.skip(
    !baseline.collection.length,
    "No source record for positive search.",
  );
  const item: Item = baseline.collection[0],
    found = await search(page, item.name);
  expect(ids(found.collection)).toContain(item.id);
  for (const record of found.collection)
    expect(record.name).toContain(item.name);
  expect((await search(page, "INV-AI-NONE-" + Date.now())).collection).toEqual(
    [],
  );
  expect(ids((await search(page, "")).collection)).toEqual(
    ids(baseline.collection),
  );
});
for (const missing of ["both", "name", "tags"] as const) {
  test(`required fields reject missing ${missing}`, async ({ page }) => {
    await open(page);
    await create(page);
    if (missing === "name") await choose(page, "Receipts");
    if (missing === "tags") await field(page, "Name *").fill("INV-AI-UNSAVED");
    const writes: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && new URL(r.url()).pathname === api)
        writes.push(r.method());
    });
    await button(page, "Submit").click();
    if (missing !== "tags")
      await expect(
        page.getByText("Name is required", { exact: true }),
      ).toBeVisible();
    if (missing !== "name")
      await expect(
        page.getByText(/(?:tags|pages).*required/i).first(),
      ).toBeVisible();
    await expect(button(page, "Submit")).toBeVisible();
    await evidence("invalid-submission-writes", writes);
    expect(writes).toEqual([]);
  });
}
test("tag options and unsaved creation reset", async ({ page }) => {
  await open(page);
  await create(page);
  await page.getByRole("combobox", { name: "Tags *", exact: true }).click();
  await expect(page.getByRole("option")).toHaveText(tags);
  await page.keyboard.press("Escape");
  await field(page, "Name *").fill("INV-AI-DISCARD");
  await field(page, "Description").fill("Unsaved inventory item");
  await choose(page, "Receipts");
  await open(page);
  await create(page);
  await expect(field(page, "Name *")).toBeEmpty();
  await expect(field(page, "Description")).toBeEmpty();
  await expect(button(page, "Receipts")).toHaveCount(0);
});
for (const tag of tags) {
  test(`tag filter ${tag} and Reset`, async ({ page }) => {
    const baseline = await open(page);
    await button(page, "Filter").click();
    await choose(page, tag, true);
    const pending = source(response(page));
    await button(page, "Submit").click();
    const filtered = await pending;
    await match(page, filtered);
    await evidence("tag-filter-comparison", { tag, baseline, filtered });
    expect(
      filtered.moduleId,
      "Filter must send the selected module",
    ).not.toBeNull();
    if (baseline.meta.last_page === 1)
      expect(ids(filtered.collection)).toEqual(
        ids(
          baseline.collection.filter((item: Item) =>
            item.module_id.includes(filtered.moduleId),
          ),
        ),
      );
    await button(page, "Filter").click();
    const reset = source(response(page));
    await button(page, "Reset").click();
    const restored = await reset;
    await match(page, restored);
    expect(ids(restored.collection)).toEqual(ids(baseline.collection));
  });
}
test("cancel filter preserves source records", async ({ page }) => {
  const baseline = await open(page);
  await button(page, "Filter").click();
  await choose(page, "Receipts", true);
  await button(page, "close").click();
  await match(page, baseline);
});
test("owned item create edit discard mappings cancel deletion and delete", async ({
  page,
}) => {
  let name = "INV-AI-E2E-" + Date.now(),
    id = "",
    deleted = false;
  await mkdir(folder, { recursive: true });
  const previous = JSON.parse(
    await readFile(`${folder}/fixture.json`, "utf8").catch(
      (error: { code?: string }) => {
        if (error.code === "ENOENT") return "null";
        throw error;
      },
    ),
  );
  if (previous?.name?.startsWith("INV-AI-E2E-") && previous.id) {
    await open(page);
    await search(page, previous.name);
    for (const candidate of [previous.name, previous.name + "-EDIT"]) {
      const owned = row(page, candidate).filter({
        has: page.getByText("#" + previous.id, { exact: true }),
      });
      if (await owned.count()) await remove(page, candidate, previous.id);
    }
  }
  try {
    await open(page);
    await create(page);
    await field(page, "Name *").fill(name);
    await field(page, "Description").fill("Inventory test item");
    await choose(page, "Receipts");
    const pending = response(page, "POST");
    await button(page, "Submit").click();
    const res = await pending,
      body = await res.json();
    id = String(body.data?.id ?? "");
    await writeFile(`${folder}/fixture.json`, JSON.stringify({ id, name }));
    await evidence("inventory-item-create", { status: res.status(), body });
    expect(res.ok()).toBeTruthy();
    expect(body.is_success).toBe(true);
    expect(id).not.toBe("");
    await open(page);
    await search(page, name);
    const pages = await row(page, name).getByRole("cell").nth(2).innerText();
    await evidence("inventory-pages-display", {
      id,
      expected: "Receipts",
      actual: pages,
      savedModules: body.data.module_id,
    });
    const screen = `${folder}/saved-pages.png`;
    await page.screenshot({ path: screen, fullPage: true });
    await test
      .info()
      .attach("saved-pages-screen", { path: screen, contentType: "image/png" });
    expect
      .soft(pages, "Saved Receipts mapping must appear in Pages column")
      .toContain("Receipts");
    await button(page, "Filter").click();
    await choose(page, "Receipts", true);
    const filtered = source(response(page));
    await button(page, "Submit").click();
    const receipts = await filtered;
    await evidence("owned-receipts-filter", {
      id,
      savedModules: body.data.module_id,
      filterModule: receipts.moduleId,
      returnedIds: ids(receipts.collection),
    });
    expect
      .soft(
        ids(receipts.collection),
        "Receipts filter must retain the item created with Receipts",
      )
      .toContain(Number(id));
    await open(page);
    await search(page, name);
    await action(page, name, "Edit");
    await expect(field(page, "Name *")).toHaveValue(name);
    await expect(field(page, "Description")).toHaveValue("Inventory test item");
    await expect(button(page, "Receipts")).toBeVisible();
    await field(page, "Name *").fill(name + "-DISCARD");
    await open(page);
    await search(page, name);
    await action(page, name, "Edit");
    await expect(field(page, "Name *")).toHaveValue(name);
    const edited = name + "-EDIT";
    await field(page, "Name *").fill(edited);
    await field(page, "Description").fill("Edited inventory item");
    await choose(page, "Deliveries");
    const save = source(response(page, "PUT", `${api}/${id}`));
    await button(page, "Save").click();
    await save;
    name = edited;
    await open(page);
    await search(page, name);
    await action(page, name, "Edit");
    await expect(field(page, "Name *")).toHaveValue(name);
    await expect(field(page, "Description")).toHaveValue(
      "Edited inventory item",
    );
    for (const tag of ["Receipts", "Deliveries"])
      await expect(button(page, tag)).toBeVisible();
    await open(page);
    await search(page, name);
    await action(page, name, "Delete");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await open(page);
    await search(page, name);
    await expect(row(page, name)).toBeVisible();
    await remove(page, name, id);
    deleted = true;
    await writeFile(`${folder}/cleanup.json`, JSON.stringify({ id, deleted }));
  } finally {
    if (id && !deleted) {
      try {
        await open(page);
        await search(page, "INV-AI-E2E-");
        for (const candidate of [name + "-EDIT", name])
          if (await row(page, candidate).count()) {
            await remove(page, candidate, id);
            break;
          }
      } catch (error) {
        await evidence("owned-record-cleanup-issue", {
          id,
          name,
          error: String(error),
        });
      }
    }
  }
});
