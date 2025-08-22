import { Page, Locator, expect } from "@playwright/test";

export class Homepage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("https://www.londonstockexchange.com/");
    await expect(this.page).toHaveTitle(/London Stock Exchange/);
    await this.page.getByRole("button", { name: /Accept all cookies/ }).click();
  }
}
