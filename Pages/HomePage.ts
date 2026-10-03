import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HomeLocators } from './LocatorsPage';

export class HomePage extends BasePage {
  readonly home: HomeLocators;

  constructor(page: Page) {
    super(page, '/');
    this.home = new HomeLocators(page);
  }

  async expectHero(): Promise<void> {
    await expect(this.home.heroTitle).toContainText(/proiectare/i);
    await expect(this.home.argExperience).toBeVisible();
    await expect(this.home.argSeriousness).toBeVisible();
  }

  async openPortfolioFromCta(): Promise<void> {
    await this.home.ctaPortfolio.click();
    await expect(this.page).toHaveURL(/\/portfolio\/?$/);
  }

  async openOfferFromCta(): Promise<void> {
    await this.home.ctaOffer.click();
    await expect(this.page).toHaveURL(/\/contact\/?$/);
  }

  async expectCurrentYearInFooter(): Promise<void> {
    const year = String(new Date().getFullYear());
    await expect.soft(this.commons.footer, `© ${year}`).toContainText(year);
  }
}
