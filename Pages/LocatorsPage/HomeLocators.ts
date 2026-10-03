import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Home (/). */
export class HomeLocators {
  constructor(private readonly page: Page) {}

  get heroTitle(): Locator { return this.page.getByRole('heading', { level: 1 }); }
  get ctaPortfolio(): Locator { return this.page.getByRole('link', { name: /Vezi portofoliul/i }); }
  get ctaOffer(): Locator { return this.page.getByRole('link', { name: /Cere o ofert/i }); }
  get argExperience(): Locator { return this.page.getByText('Experiență', { exact: true }); }
  get argSeriousness(): Locator { return this.page.getByText('Seriozitate', { exact: true }); }
}
