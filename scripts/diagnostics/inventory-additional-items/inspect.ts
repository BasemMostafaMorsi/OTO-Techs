import { test, expect } from "../../../tests/helpers/test";
import { login } from "../../../tests/helpers/auth";
import { mkdir, writeFile } from "node:fs/promises";

const route = "/en/finance/inventory/configuration/additional-items";
const folder = "artifacts/finance/inventory/configuration/additional-items";

test("inspect inventory additional items controls", async ({ page }, info) => {
  test.setTimeout(90000);
  await login(page);
  await mkdir(folder, { recursive: true });
  const responses: unknown[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", response => {
    if (response.request().method() === "GET" && new URL(response.url()).pathname.includes("additional")) {
      pending.push(response.json().then(body => { responses.push({ path: new URL(response.url()).pathname, status: response.status(), body }); }).catch(() => {}));
    }
  });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Create", exact: true })).toBeVisible();
  await writeFile(`${folder}/list-ui.txt`, await page.locator("main").ariaSnapshot());
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await writeFile(`${folder}/filter-ui.txt`, await page.locator("body").ariaSnapshot());
  await page.getByRole("button", { name: "close", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
  await writeFile(`${folder}/create-ui.txt`, await page.locator("main").ariaSnapshot());
  const combo = page.getByRole("combobox");
  if (await combo.count()) {
    await combo.first().click();
    await writeFile(`${folder}/options.json`, JSON.stringify(await page.getByRole("option").allTextContents()));
  }
  await Promise.all(pending);
  await writeFile(`${folder}/source.json`, JSON.stringify(responses, null, 2));
  await page.screenshot({ path: `${folder}/discovery.png`, fullPage: true });
  await info.attach("inventory-additional-source", { body: JSON.stringify(responses), contentType: "application/json" });
});
