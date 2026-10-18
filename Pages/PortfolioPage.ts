import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PortfolioLocators } from './LocatorsPage';

export class PortfolioPage extends BasePage {
  readonly portfolio: PortfolioLocators;

  constructor(page: Page) {
    super(page, '/portofoliu/');
    this.portfolio = new PortfolioLocators(page);
  }

  async expectCategories(): Promise<void> {
    await expect(this.portfolio.title).toBeVisible();
    for (const cat of PortfolioLocators.CATEGORIES) {
      await expect.soft(this.portfolio.categoryTitle(cat.id), cat.name).toBeVisible();
    }
  }
}
