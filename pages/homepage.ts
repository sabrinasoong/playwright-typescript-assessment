import { Page, Locator, expect } from "@playwright/test";
import { LONDON_STOCK_EXCHANGE_HOMEPAGE } from "../constants/urls";

export class Homepage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(LONDON_STOCK_EXCHANGE_HOMEPAGE);
    await expect(this.page).toHaveTitle(/London Stock Exchange/);
    await this.page.getByRole("button", { name: /Accept all cookies/ }).click();
  }
}
