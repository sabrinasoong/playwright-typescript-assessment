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

  // Gets information for top 10 highest percentage change constituents
  const table = await ftse100Page.getAllDataFromTables();
  await ftse100Page.getTop10Rows(table);

  // Export data to CSV
  const csvTable = await ftse100Page.getDataFromTable(table);
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

  // Export data to CSV
  const csvTable = await ftse100Page.getDataFromTable(table);
  writeToCSV(csvTable, "ftse_100_top10_lowest_percentage");
});
