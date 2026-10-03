import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Articole (/articole/) și paginile de articol. */
export class ArticoleLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByRole('heading', { level: 1 }); }
  /** Linkurile către articole (exclude linkul din meniu către /articole/). */
  get articleLinks(): Locator {
    return this.page.getByRole('main').getByRole('link').filter({ hasNotText: /^Articole$/ });
  }
  get articleBody(): Locator { return this.page.locator('main, article, body').first(); }
}
