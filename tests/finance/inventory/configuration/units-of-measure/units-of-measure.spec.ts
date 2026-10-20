import { test, expect, Page } from "../../../../helpers/test";
import { login } from "../../../../helpers/auth";

const route = "/en/finance/inventory/configuration/units";
const api = "/api/v1.0/unites";

const button = (p: Page, name: string) => p.getByRole("button", { name, exact: true });
const field = (p: Page, placeholder: string) => p.getByPlaceholder(placeholder, { exact: true });
const evidence = (name: string, data: unknown) =>
  test.info().attach(name, {
    body: JSON.stringify(data),
    contentType: "application/json",
  });

type UnitRecord = {
  id: number;
  unit_code: string;
  is_active: number | string;
  locale_unit_translates: { name: string };
};
type UnitList = {
  data: {
    collection: UnitRecord[];
    meta: { last_page: number; total: number };
  };
};
const ids = (items: UnitRecord[]) => items.map((item) => item.id).sort((a, b) => a - b);

const rows = (p: Page) => p.locator("tbody tr").filter({ has: p.getByRole("checkbox") });

const row = (p: Page, name: string) => rows(p).filter({ has: p.getByText(name, { exact: true }) });

async function action(p: Page, name: string, label: "Edit" | "Delete") {
  await row(p, name).getByRole("button", { name: "more", exact: true }).click();
  await p.getByRole("menuitem", { name: label, exact: true }).click();
}

async function deleteUnit(p: Page, name: string) {
  await action(p, name, "Delete");
  await expect(button(p, "Delete")).toBeVisible();
  const pending = mutationResponse(p, "DELETE");
  await button(p, "Delete").click();
  return pending;
}

function listResponse(p: Page) {
  return p.waitForResponse(
    (r) => r.request().method() === "GET" && new URL(r.url()).pathname === api,
    { timeout: 60_000 },
  );
}

function mutationResponse(p: Page, method: "POST" | "PUT" | "DELETE") {
  return p.waitForResponse(
    (r) => r.request().method() === method && new URL(r.url()).pathname.startsWith(api),
    { timeout: 30_000 },
  );
}

async function open(p: Page) {
  await p.goto("about:blank");
  const pending = listResponse(p);
  await p.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const res = await pending;
  expect(res.ok()).toBeTruthy();
  await expect(button(p, "Create")).toBeVisible();
  return res;
}

async function fillForm(p: Page, name: string, code: string) {
  await field(p, "Unit name").fill(name);
  await field(p, "Unit code").fill(code);
}

async function chooseType(p: Page, type: "Primary" | "Secondary" = "Primary") {
  await p.getByRole("combobox", { name: /Unit type/i }).click();
  const options = p.getByRole("option");
  await expect(options.first()).toBeVisible();
  await test.info().attach("unit-type-options", {
    body: JSON.stringify(await options.allTextContents()),
    contentType: "application/json",
  });
  await p.getByRole("option", { name: type, exact: true }).click();
}

async function search(p: Page, term: string) {
  const pending = listResponse(p);
  await field(p, "Search").fill(term);
  const res = await pending;
  expect(res.ok()).toBeTruthy();
  return res;
}

async function matchList(p: Page, body: UnitList) {
  const records = body.data.collection;
  await expect(rows(p)).toHaveCount(records.length);
  for (const item of records) {
    // Displayed # is the translation ID, not the unit's API ID.
    // Match the business code, then verify the independent name and status.
    const current = rows(p).filter({
      has: p.getByRole("cell", { name: item.unit_code, exact: true }),
    }).filter({ has: p.getByText(item.locale_unit_translates.name, {exact:true}) });
    await expect(current).toHaveCount(1);
    await expect(current).toContainText(item.locale_unit_translates.name);
    await expect(current).toContainText(item.unit_code);
    await expect(current.locator("input.MuiSwitch-input")).toBeChecked({
      checked: Boolean(Number(item.is_active)),
    });
  }
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
});

test.afterEach(async ({ page }, info) => {
  try {
    const body = await page.screenshot({ fullPage: true, timeout: 10_000 });
    await info.attach("uom-screen", { body, contentType: "image/png" });
  } catch (error) {
    await info.attach("screenshot-diagnostic", {
      body: String(error),
      contentType: "text/plain",
    });
  }
});

test("list loads and row count matches API total", async ({ page }, info) => {
  const res = await open(page);
  const body = await res.json();
  await evidence("list-response", body);
  await matchList(page, body);
});

test("name search no-match and clear restore records", async ({ page }) => {
  await open(page);
  const beforeText = await page.getByRole("button", { name: /^\d+\/\d+$/ }).innerText();

  await search(page, "UOM-NONE-" + Date.now());
  await expect(button(page, "0/0")).toBeVisible();

  await search(page, "");
  await expect(page.getByRole("button", { name: beforeText, exact: true })).toBeVisible();
});

test("blank create shows required field errors and stays on page", async ({ page }) => {
  await open(page);
  await button(page, "Create").click();

  await fillForm(page, "", "");
  await button(page, "Submit").click();

  await expect(page.getByText(/name.*required|required.*name/i).first()).toBeVisible({
    timeout: 10_000,
  });

  await expect(button(page, "Submit")).toBeVisible();
});

test("existing name search matches source records", async ({ page }, info) => {
  const baseline = await (await open(page)).json();
  const sample = baseline.data.collection[0];
  test.skip(!sample, "No source unit is available for positive search.");
  const name = sample.locale_unit_translates.name;
  const body = await (await search(page, name)).json();
  await evidence("positive-search-source", { baseline, search: body });
  expect(body.data.collection.some((item: UnitRecord) => item.id === sample.id)).toBeTruthy();
  for (const item of body.data.collection) expect(item.locale_unit_translates.name).toContain(name);
  await matchList(page, body);
  await matchList(page, await (await search(page, "")).json());
});

test("leaving unsaved creation discards entered fields", async ({ page }) => {
  await open(page);
  await button(page, "Create").click();
  await fillForm(page, "UOM-DISCARD-" + Date.now(), "DISCARD");
  await open(page);
  await button(page, "Create").click();
  await expect(field(page, "Unit name")).toHaveValue("");
  await expect(field(page, "Unit code")).toHaveValue("");
});

test("missing name with populated code is rejected without create request", async ({
  page,
}, info) => {
  await open(page);
  await button(page, "Create").click();
  await chooseType(page);
  await fillForm(page, "", "U" + Date.now());
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname.startsWith(api))
      writes.push(request.url());
  });
  await button(page, "Submit").click();
  await expect(page.getByText(/name.*required|required.*name/i).first()).toBeVisible();
  await evidence("invalid-create-requests", writes);
  expect(writes).toEqual([]);
});

for (const missing of ["type", "code"] as const) {
  test(`missing unit ${missing} is rejected`, async ({ page }) => {
    await open(page);
    await button(page, "Create").click();
    if (missing !== "type") await chooseType(page);
    await fillForm(page, "UOM-INVALID-" + Date.now(), missing === "code" ? "" : "INVALID");
    await button(page, "Submit").click();
    await expect(
      page
        .getByText(missing === "type" ? /unit type is required/i : /code.*required|required.*code/i)
        .first(),
    ).toBeVisible();
    await expect(button(page, "Submit")).toBeVisible();
  });
}

test("secondary type reveals primary unit and conversion fields and requires a parent", async ({
  page,
}) => {
  await open(page);
  await button(page, "Create").click();
  await chooseType(page, "Secondary");
  await page.getByRole("combobox", { name: /Unit type/i }).press("Tab");
  await evidence("secondary-type-after-blur", {
    expected: "Secondary",
    actual: await page.getByRole("combobox", { name: /Unit type/i }).inputValue(),
  });
  await expect(page.getByRole("combobox", { name: /Unit type/i })).toHaveValue("Secondary");
  await expect(page.getByRole("combobox", { name: /Primary unit name/i })).toBeVisible();
  await expect(field(page, "Rate of change")).toHaveValue("1");
  await fillForm(page, "UOM-SECONDARY-" + Date.now(), "SECONDARY");
  await button(page, "Submit").click();
  await expect(page.getByText("Primary unit is required", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await chooseType(page, "Primary");
  await expect(page.getByRole("combobox", { name: /Primary unit name/i })).toHaveCount(0);
  await expect(field(page, "Rate of change")).toHaveCount(0);
});

test("row selection and select all can be cleared without mutation", async ({ page }) => {
  const body = await (await open(page)).json();
  test.skip(!body.data.collection.length, "No rows are available to select.");
  const first = rows(page).first().getByRole("checkbox").first();
  await first.check();
  await expect(first).toBeChecked();
  await first.uncheck();
  await expect(first).not.toBeChecked();
  const all = page.locator("thead").getByRole("checkbox").first();
  await all.check();
  for (let i = 0; i < body.data.collection.length; i++)
    await expect(rows(page).nth(i).getByRole("checkbox").first()).toBeChecked();
  await all.uncheck();
  for (let i = 0; i < body.data.collection.length; i++)
    await expect(rows(page).nth(i).getByRole("checkbox").first()).not.toBeChecked();
  await matchList(page, body);
});

test("name search combined with status filter returns their intersection", async ({
  page,
}, info) => {
  const baseline = await (await open(page)).json();
  const sample = baseline.data.collection[0];
  test.skip(!sample, "No source unit is available.");
  const name = sample.locale_unit_translates.name;
  const active = Boolean(Number(sample.is_active));
  const searched = await (await search(page, name)).json();
  await button(page, "Filter").click();
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: active ? "Active" : "Inactive", exact: true }).click();
  const pending = listResponse(page);
  await button(page, "Submit").click();
  const body = await (await pending).json();
  await evidence("combined-filter-source", { searched, filtered: body });
  expect(ids(body.data.collection)).toEqual(
    ids(
      searched.data.collection.filter(
        (item: UnitRecord) => Boolean(Number(item.is_active)) === active,
      ),
    ),
  );
  await matchList(page, body);
});

for (const status of ["Active", "Inactive"] as const) {
  test(`status filter ${status} and Reset`, async ({ page }, info) => {
    const baseline = await (await open(page)).json();
    await button(page, "Filter").click();

    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    const pending = listResponse(page);
    await button(page, "Submit").click();
    const res = await pending;
    const body = await res.json();
    await evidence(`filter-${status.toLowerCase()}`, body);
    expect(res.ok()).toBeTruthy();
    await matchList(page, body);
    for (const item of body.data.collection)
      expect(Boolean(Number(item.is_active))).toBe(status === "Active");
    if (baseline.data.meta.last_page === 1) {
      expect(ids(body.data.collection)).toEqual(
        ids(
          baseline.data.collection.filter(
            (item: UnitRecord) => Boolean(Number(item.is_active)) === (status === "Active"),
          ),
        ),
      );
    }

    await button(page, "Filter").click();
    const reset = listResponse(page);
    await button(page, "Reset").click();
    const restored = await (await reset).json();
    expect(restored.data.collection).toEqual(baseline.data.collection);
    await matchList(page, restored);
    await expect(page.getByRole("button", { name: /^\d+\/\d+$/ })).toBeVisible();
  });
}

test("cancel filter preserves current list", async ({ page }) => {
  await open(page);
  const beforeText = await page.getByRole("button", { name: /^\d+\/\d+$/ }).innerText();
  await button(page, "Filter").click();
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "Inactive", exact: true }).click();
  // Close without submitting
  await button(page, "close").click();
  await expect(page.getByRole("button", { name: beforeText, exact: true })).toBeVisible();
});

test("create edit cancel status reload and confirmed delete lifecycle", async ({ page }, info) => {
  await open(page);

  const name = "UOM-E2E-" + Date.now();
  const code = "U" + String(Date.now()).slice(-5);
  let id = "";
  let deleted = false;

  try {
    await button(page, "Create").click();
    // Primary is already selected. Verify it instead of toggling it off by
    // selecting the same option again.
    await expect(page.getByRole("combobox", { name: /Unit type/i })).toHaveValue("Primary");
    await fillForm(page, name, code);

    const pending = mutationResponse(page, "POST");
    const submitted = Promise.race([
      pending,
      page.getByText("Unit type is required", {exact:true})
        .waitFor({state:"visible",timeout:30_000})
        .then(async () => {
          const selected = await page.getByRole("combobox", {name:/Unit type/i}).inputValue();
          await evidence("unit-type-validation", {selected, message:"Unit type is required"});
          throw new Error(`Unit type displays "${selected}" but submission rejects it: Unit type is required`);
        }),
    ]);
    // Attach rejection handling before clicking; retain the response timeout for
    // genuine network failures while surfacing synchronous validation failures.
    submitted.catch(() => {});
    await button(page, "Submit").click();
    const res = await submitted;
    const body = await res.json();
    id = String(body.data?.id ?? body.id ?? "");

    await info.attach("fixture.json", {
      body: JSON.stringify({ id, name, code }),
      contentType: "application/json",
    });
    await evidence("create-response", { status: res.status(), body });

    expect(res.ok(), JSON.stringify(body)).toBeTruthy();
    expect(id, "API must return an id").not.toBe("");

    await open(page);
    await search(page, name);
    await expect(row(page, name)).toBeVisible();
    await expect(row(page, name)).toContainText(code);
    await expect(row(page, name).getByText("Primary", { exact: true })).toBeVisible();

    await test.step("Discard unsaved edit and preserve saved values", async () => {
      await action(page, name, "Edit");
      const displayedType = await page.getByRole("combobox", { name: /Unit type/i }).inputValue();
      await evidence("edit-unit-type", {
        expected: "Primary",
        actual: displayedType,
        id,
      });
      const typeScreen = await page.screenshot({ fullPage: true });
      await info.attach("edit-unit-type-screen", {
        body: typeScreen,
        contentType: "image/png",
      });
      expect
        .soft(displayedType, "Editing a Primary unit must preserve its saved unit type")
        .toBe("Primary");
      await expect(field(page, "Unit name")).toHaveValue(name);
      await expect(field(page, "Unit code")).toHaveValue(code);
      await fillForm(page, name + "-DISCARD", code + "X");
      await open(page);
      await search(page, name);
      await expect(row(page, name)).toContainText(code);
      await expect(row(page, name + "-DISCARD")).toHaveCount(0);
    });

    const editedName = name + "-EDIT";
    const editedCode = code + "E";

    await action(page, name, "Edit");
    await expect(page.getByRole("combobox", { name: /Unit type/i })).toHaveValue("Primary");
    await fillForm(page, editedName, editedCode);

    const editPending = mutationResponse(page, "PUT");
    await button(page, "Save").click();
    const editRes = await editPending;
    await evidence("edit-response", {
      status: editRes.status(),
      body: await editRes.json(),
    });
    expect(editRes.ok()).toBeTruthy();

    await open(page);
    await search(page, editedName);
    await expect(row(page, editedName)).toBeVisible();
    await expect(row(page, editedName)).toContainText(editedCode);

    const toggle = row(page, editedName).locator("input.MuiSwitch-input");
    await expect(toggle).toBeChecked();
    for (const checked of [false, true]) {
      await toggle.click();
      await expect(toggle).toBeChecked({ checked });
      await open(page);
      await search(page, editedName);
      await expect(toggle).toBeChecked({ checked });
    }

    await action(page, editedName, "Delete");

    const cancelBtn = button(page, "Cancel");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await open(page);
    await search(page, editedName);
    await expect(row(page, editedName)).toBeVisible();

    const delRes = await deleteUnit(page, editedName);
    await info.attach("cleanup.json", {
      body: JSON.stringify({ id, status: delRes.status() }),
      contentType: "application/json",
    });
    await evidence("delete-response", { id, status: delRes.status() });
    expect(delRes.ok()).toBeTruthy();
    deleted = true;
  } finally {
    if (id && !deleted) {
      try {
        await open(page);

        for (const n of [name + "-EDIT", name]) {
          await search(page, n);
          if ((await row(page, n).count()) > 0) {
            await deleteUnit(page, n);
            break;
          }
        }
      } catch {
        /* best-effort cleanup */
      }
    }
  }
});
