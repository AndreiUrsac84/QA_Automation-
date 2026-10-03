import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Portofoliu (/portfolio/). */
export class PortfolioLocators {
  /** Titlurile categoriilor de proiecte (H2). */
  static readonly CATEGORIES = ['Locuințe', 'Edilitare', 'Hale', 'Internațional', 'Consultanță'] as const;

  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByRole('heading', { level: 1 }); }
  category(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: new RegExp(name, 'i') }).first();
  }
}
