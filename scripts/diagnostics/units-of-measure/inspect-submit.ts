import { test } from "../../../tests/helpers/test";
import { login } from "../../../tests/helpers/auth";
import { writeFile, mkdir } from "node:fs/promises";

test("inspect unit type dropdown options", async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);

  await page.goto("/en/finance/inventory/configuration/units", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForTimeout(500);

  // The Unit type dropdown has placeholder "Choose" — click it
  await page.getByText("Choose", { exact: true }).click();
  await page.waitForTimeout(600);

  // Grab all options that appeared
  const options = await page.getByRole("option").allInnerTexts();
  console.log("=== UNIT TYPE OPTIONS ===", options);

  // Also try li elements inside any dropdown/listbox
  const liOptions = await page
    .locator(
      '[role="listbox"] li, ul[role="listbox"] li, .MuiMenu-list li, .dropdown-menu li',
    )
    .allInnerTexts();
  console.log("=== LI OPTIONS ===", liOptions);

  await page.screenshot({
    path: "artifacts/finance/inventory/configuration/units-of-measure/unit-type-open.png",
    fullPage: true,
  });

  await mkdir("artifacts/finance/inventory/configuration/units-of-measure", {
    recursive: true,
  });
  await writeFile(
    "artifacts/finance/inventory/configuration/units-of-measure/unit-type-options.json",
    JSON.stringify({ options, liOptions }, null, 2),
  );
  await test.info().attach("unit-type-options", {
    body: JSON.stringify({ options, liOptions }, null, 2),
    contentType: "application/json",
  });
});
