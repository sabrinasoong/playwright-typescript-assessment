import { test, expect } from "@playwright/test";
import { writeToCSV } from "../utils/createCSVHelper";
import { Homepage } from "../pages/homepage";
import { Ftse100Page } from "../pages/ftse100Page";
import { getLowestIndexMonth } from "../utils/ftseDataSorterHelper";
import { FTSE100_API_HISTORICAL, FTSE100_API_REFRESH } from "../constants/urls";

test("should navigate to the homepage", async ({ page }) => {
  const homepage = new Homepage(page);
  await homepage.goto();

  // Expect London Stock Exchange homepage
  await expect(page).toHaveTitle(/London Stock Exchange/);
});

test("should return top 10 constituents with highest percentage content", async ({
  browser,
  context,
  page,
}) => {
  const homepage = new Homepage(page);
  await homepage.goto();

  // Waits for new tab to open
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
    const numericValue = parseFloat(el.percentualchange);
    if (!Number.isNaN(numericValue)) {
      expect(numericValue).toBeGreaterThanOrEqual(-100);
      expect(numericValue).toBeLessThanOrEqual(100);
    }
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
  await ftse100Page.waitForDataRefresh(FTSE100_API_REFRESH);

  // Gets information for top 10 lowest percentage change constituents
  const table = await ftse100Page.getAllDataFromTables();
  await ftse100Page.getTop10Rows(table);
  const csvTable = await ftse100Page.getDataFromTable(table);

  // Checks that all values are not empty
  csvTable.forEach((el) => {
    const numericValue = parseFloat(el.percentualchange);
    if (!Number.isNaN(numericValue)) {
      expect(numericValue).toBeGreaterThanOrEqual(-100);
      expect(numericValue).toBeLessThanOrEqual(100);
    }
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
  await ftse100Page.waitForDataRefresh(FTSE100_API_REFRESH);

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

test("should determine which month over past 3 years has lowest average index value", async ({
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
  await ftse100Page.goToOverview();

  // Filters graph by last 3 years
  ftse100Page.editYearFromFilter(3);

  // Filters graph to display Monthly
  await ftse100Page.editGraphPeriodType("Monthly");

  // Get data and determine lowest average index value
  const response = await ftse100Page.waitForDataRefresh(FTSE100_API_HISTORICAL);

  const json = await response.json();
  const month = getLowestIndexMonth(json.data);

  expect(month).toMatch(/^(0[1-9]|1[0-2])-\d{4}$/);

  console.log(`The month with the lowest average index value is: ${month}`);
});
