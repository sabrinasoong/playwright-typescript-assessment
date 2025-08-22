import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { dataType, writeToCSV } from "../utils/createCSVHelper";
import { Homepage } from "../pages/homepage";
import { Ftse100Page } from "../pages/ftse100Page";

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

  // Wait for new tab to open
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /View FTSE 100/ }).click(),
  ]);
  await newTab.waitForLoadState();

  // Checks for new tab page to be loaded
  const ftse100Page = new Ftse100Page(newTab);
  await ftse100Page.checkPageIsLoaded();

  // Gets data for top 10 highest percentage change constituents
  const table = await ftse100Page.getAllDataFromTables();
  const top10 = await ftse100Page.getTop10Rows(table);
  const csvTable = await ftse100Page.getDataFromTable(top10);

  // Checks that all values are not empty
  csvTable.forEach((el) => {
    expect(el.percentualchange).not.toBeFalsy();
  });

  // Export data to CSV
  writeToCSV(csvTable, "ftse_100_top10_highest_percentage");
});

test("should return top 10 constituents with lowest percentage content", async ({
  browser,
  context,
  page,
}) => {
  const homepage = new Homepage(page);
  await homepage.goto();

  // Wait for new tab to open
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /View FTSE 100/ }).click(),
  ]);
  await newTab.waitForLoadState();

  // Checks for new tab page to be loaded
  const ftse100Page = new Ftse100Page(newTab);
  await ftse100Page.checkPageIsLoaded();

  // Sorts table by Lowest percentage change
  await ftse100Page.filterBy("Change %", true);
  await ftse100Page.waitForTableRefresh();

  // Gets information for top 10 lowest percentage change constituents
  const table = await ftse100Page.getAllDataFromTables();
  await ftse100Page.getTop10Rows(table);
  const csvTable = await ftse100Page.getDataFromTable(table);

  // Checks that all values are not empty
  csvTable.forEach((el) => {
    expect(el.percentualchange).not.toBeFalsy();
  });

  // Export data to CSV
  writeToCSV(csvTable, "ftse_100_top10_lowest_percentage");
});

test("should return constituents exceeding 7 million in Market Cap", async ({
  browser,
  context,
  page,
}) => {
  const homepage = new Homepage(page);
  await homepage.goto();

  // Wait for new tab to open
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: /View FTSE 100/ }).click(),
  ]);
  await newTab.waitForLoadState();

  // Checks for new tab page to be loaded
  const ftse100Page = new Ftse100Page(newTab);
  await ftse100Page.checkPageIsLoaded();

  // Sorts table by Market Cap
  await ftse100Page.filterBy("Market cap (m)", false);
  await ftse100Page.waitForTableRefresh();

  // Gets information for top 10 lowest percentage change constituents
  const table = await ftse100Page.getAllDataFromTables();
  const csvTable = await ftse100Page.getMinMarketCap(7, table);

  // Checks that all data is greater than 7 (million)
  for (const row of csvTable!) {
    const value = parseFloat(row.marketCap.replace(/,/g, ""));
    expect(value).toBeGreaterThanOrEqual(7);
  }

  // Export data to CSV
  writeToCSV(csvTable!, "ftse_100_exceeds_7mil");
});
