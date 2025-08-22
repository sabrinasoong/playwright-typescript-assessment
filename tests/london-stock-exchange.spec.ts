import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test("should navigate to the homepage", async ({ page }) => {
  await page.goto("https://www.londonstockexchange.com/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/London Stock Exchange/);
});

test("should return top 10 constituents with highest percentage content", async ({
  browser,
  context,
  page,
}) => {
  await page.goto("https://www.londonstockexchange.com/");

  // Click on Accept all cookies
  await page.getByRole("button", { name: /Accept all cookies/ }).click();

  // Wait for new tab to open
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /View FTSE 100/ }).click(),
  ]);

  await newTab.waitForLoadState();

  await expect(newTab).toHaveURL(
    "https://www.londonstockexchange.com/indices/ftse-100/constituents"
  );
  await expect(newTab.getByRole("heading", { name: /FTSE 100/ })).toBeVisible();

  await newTab.waitForSelector("table tbody tr", { state: "visible" });

  const table = await newTab.locator("table tbody tr").all();
  const top10 = table.slice(0, 10);

  const top10table: Array<{
    code: string;
    name: string;
    currency: string;
    marketCap: string;
    netChange: string;
    percentualchange: string;
  }> = [];

  // Grabs information for top 10
  for (const row of top10) {
    const code = await row.locator(".instrument-tidm").innerText();
    const name = await row.locator(".ellipsed").innerText();

    const currency = await row.locator(".instrument-currency").innerText();
    const marketCap = await row
      .locator(".instrument-marketcapitalization")
      .innerText();

    const netChange = await row.locator(".instrument-netchange").innerText();
    const percentualchange = await row
      .locator(".instrument-percentualchange")
      .innerText();

    top10table.push({
      code,
      name,
      currency,
      marketCap,
      netChange,
      percentualchange,
    });
  }

  // Convert to CSV
  const headers = Object.keys(top10table[0]).join(",");
  const rowsCSV = top10table
    .map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    )
    .join("\n");
  const csvContent = `${headers}\n${rowsCSV}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const outputDir = path.join(__dirname, "reports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `top10_ftse100_${timestamp}.csv`);
  fs.writeFileSync(filePath, csvContent);

  console.log(`CSV file generated: top10_ftse100_${timestamp}.csv`);
});
