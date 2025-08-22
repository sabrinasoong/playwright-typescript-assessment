import { Page, Locator, expect } from "@playwright/test";
import { dataType } from "../utils/createCSVHelper";
import { LONDON_STOCK_EXCHANGE_FTSE100_CONSTITUENTS } from "../constants/urls";

type PeriodType = "Monthly" | "Daily" | "Yearly";

export class Ftse100Page {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async extractRowData(row: Locator) {
    // Extracts all row data from the ftse 100 table
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

    return {
      code,
      name,
      currency,
      marketCap,
      netChange,
      percentualchange,
    };
  }

  async checkPageIsLoaded() {
    await expect(this.page).toHaveURL(
      LONDON_STOCK_EXCHANGE_FTSE100_CONSTITUENTS,
      { timeout: 10000 }
    );
    await expect(
      this.page.getByRole("heading", { name: /FTSE 100/ })
    ).toBeVisible();
  }

  async goToOverview() {
    await this.page.getByRole("link", { name: /Overview/ }).click();
    await expect(this.page.locator("#ftse-ticker")).toBeVisible();
  }

  async filterBy(filter: string, ascending: boolean) {
    const filterBy = ascending ? "Lowest – highest" : "Highest – lowest";

    await this.page.getByRole("cell", { name: `${filter}` }).click();
    await this.page
      .getByRole("listitem")
      .filter({ hasText: filterBy })
      .locator("div")
      .click();
  }

  async waitForDataRefresh(request: string) {
    return await this.page.waitForResponse(
      (res) => res.url().includes(request) && res.status() === 200
    );
  }

  async getAllDataFromTables() {
    await this.page.waitForSelector("table tbody tr", { state: "visible" });

    const table = await this.page.locator("table tbody tr").all();
    await this.page.waitForSelector("table tbody tr", { state: "visible" });

    return table;
  }

  async getTop10Rows(table: Locator[]) {
    return table.slice(0, 10);
  }

  async getDataFromTable(table: Locator[]) {
    // Returns data from the table by rows

    const data: dataType = [];
    for (const row of table) {
      const rowData = await this.extractRowData(row);

      data.push(rowData);
    }
    return data;
  }

  async getMinMarketCap(num: number, table: Locator[]) {
    const data: dataType = [];

    // Get all page buttons
    const pageButtons = this.page.locator(".page-number");
    const pageCount = await pageButtons.count();

    // Go through each page and get data then extracts if market cap value exceeds set num
    for (let i = 0; i < pageCount; i++) {
      await pageButtons.nth(i).click();
      await this.waitForDataRefresh(
        "https://api.londonstockexchange.com/api/v1/components/refresh"
      );

      const tableRows = await this.page.locator("table tbody tr").all();

      for (const row of tableRows) {
        const rowData = await this.extractRowData(row);

        const marketCapValue = parseFloat(rowData.marketCap.replace(/,/g, ""));

        if (marketCapValue >= num) {
          data.push(rowData);
        } else if (marketCapValue < num) {
          return;
        }
      }
    }

    return data;
  }

  async editYearFromFilter(year: number) {
    // Changes the year from filter by a set number of years
    const yearFromDate = await this.page.locator(
      '[aria-label="Year in from date"]'
    );
    await yearFromDate.click();
    const currentYearFromDate = await yearFromDate.inputValue();
    const setYear = Number(currentYearFromDate) - year + 1;
    await yearFromDate.fill(setYear.toString());
    await yearFromDate.press("Enter");
  }

  async editGraphPeriodType(periodType: PeriodType) {
    // Takes in a value and choose from the periodicity dropdown to select
    await this.page.locator(".periodicity-select").click();
    await this.page.locator(".dropdown-option-text").getByText(periodType);
  }
}
