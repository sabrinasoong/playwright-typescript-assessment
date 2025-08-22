import { Page, Locator, expect } from "@playwright/test";
import { dataType } from "../utils/createCSVHelper";

export class Ftse100Page {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly filterButton: (filter: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.tableRows = page.locator("");
    this.filterButton = (filterName: string) =>
      page.locator(`button[aria-label="${filterName}"]`);
  }

  async checkPageIsLoaded() {
    await expect(this.page).toHaveURL(
      "https://www.londonstockexchange.com/indices/ftse-100/constituents"
    );
    await expect(
      this.page.getByRole("heading", { name: /FTSE 100/ })
    ).toBeVisible();
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

  async waitForTableRefresh() {
    await this.page.waitForResponse(
      (res) =>
        res
          .url()
          .includes(
            "https://api.londonstockexchange.com/api/v1/components/refresh"
          ) && res.status() === 200
    );
  }

  async getAllDataFromTables() {
    await this.page.waitForSelector("table tbody tr", { state: "visible" });

    const table = await this.page.locator("table tbody tr").all();
    await this.page.waitForSelector("table tbody tr", { state: "visible" });

    return table;
  }

  async getTop10Rows(table: Locator[]) {
    const top10 = table.slice(0, 10);
    return top10;
  }

  async getDataFromTable(table: Locator[]) {
    const data: dataType = [];
    for (const row of table) {
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

      data.push({
        code,
        name,
        currency,
        marketCap,
        netChange,
        percentualchange,
      });
    }
    return data;
  }
}
