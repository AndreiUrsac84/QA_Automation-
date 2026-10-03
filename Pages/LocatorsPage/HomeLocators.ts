import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Home (/), după id. */
export class HomeLocators {
  constructor(private readonly page: Page) {}

  get heroTitle(): Locator { return this.page.getByTestId('home-title'); }
  get description(): Locator { return this.page.getByTestId('home-description'); }
  get ctaPortfolio(): Locator { return this.page.getByTestId('home-link-portfolio'); }
  get ctaOffer(): Locator { return this.page.getByTestId('home-link-contact'); }
  get ctaPhone(): Locator { return this.page.getByTestId('home-link-phone'); }
  get argExperience(): Locator { return this.page.getByTestId('home-highlight-experienta'); }
  get argSeriousness(): Locator { return this.page.getByTestId('home-highlight-seriozitate'); }
  get visualImage(): Locator { return this.page.getByTestId('home-visual-image'); }
}
