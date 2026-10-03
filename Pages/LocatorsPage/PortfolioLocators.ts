import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Portofoliu (/portfolio/), după id. */
export class PortfolioLocators {
  /** Categoriile de proiecte: numele afișat și id-ul titlului (H2). */
  static readonly CATEGORIES = [
    { name: 'Locuințe', id: 'portfolio-categorie-locuinte-nume' },
    { name: 'Edilitare', id: 'portfolio-categorie-edilitare-nume' },
    { name: 'Hale', id: 'portfolio-categorie-hale-nume' },
    { name: 'Internațional', id: 'portfolio-categorie-international-nume' },
    { name: 'Consultanță', id: 'portfolio-consultanta-title' },
  ] as const;

  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('portfolio-title'); }
  categoryTitle(id: string): Locator { return this.page.getByTestId(id); }
}
