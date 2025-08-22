import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { dataType, writeToCSV } from "../utils/createCSVHelper";
import { Homepage } from "../pages/homepage";

test("should navigate to the homepage", async ({ page }) => {
  const homepage = new Homepage(page);
  await homepage.goto();

  // Expect London Stock Exchange page
  await expect(page).toHaveTitle(/London Stock Exchange/);
});

test("should return top 10 constituents with highest percentage content", async ({
  browser,
  context,
  page,
}) => {
  const homepage = new Homepage(page);
  await homepage.goto();
  await homepage.acceptCookies;

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

  // Gets data from table
  await newTab.waitForSelector("table tbody tr", { state: "visible" });

  const table = await newTab.locator("table tbody tr").all();
  const top10 = table.slice(0, 10);

  const top10table: dataType = [];

  // Gets information for top 10 highest percentage change constituents
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

  // Export data to CSV
  writeToCSV(top10table, "ftse_100_top10_highest_percentage");
});

test("should return top 10 constituents with lowest percentage content", async ({
  browser,
  context,
  page,
}) => {
  const homepage = new Homepage(page);
  await homepage.goto();
  await homepage.acceptCookies;

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

  // Sorts by Lowest percentage change
  await newTab.getByRole("cell", { name: /Change %/ }).click();
  await newTab
    .getByRole("listitem")
    .filter({ hasText: "Lowest – highest" })
    .locator("div")
    .click();

  await Promise.all([
    newTab.waitForResponse(
      (res) =>
        res
          .url()
          .includes(
            "https://api.londonstockexchange.com/api/v1/components/refresh"
          ) && res.status() === 200
    ),
  ]);

  // Gets data from table
  await newTab.waitForSelector("table tbody tr", { state: "visible" });

  const table = await newTab.locator("table tbody tr").all();
  const top10 = table.slice(0, 10);

  const top10table: dataType = [];

  // Gets information for top 10 lowest percentage change constituents
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

  // Export data to CSV
  writeToCSV(top10table, "ftse_100_top10_lowest_percentage");
});
