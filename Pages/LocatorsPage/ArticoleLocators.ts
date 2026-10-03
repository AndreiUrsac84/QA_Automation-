import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Articole (/articole/) și paginile de articol, după id. */
export class ArticoleLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('articole-title'); }
  get list(): Locator { return this.page.getByTestId('articole-list'); }
  /** Cardurile (linkurile) către articole; id-ul are forma articole-card-<slug>. */
  get articleLinks(): Locator {
    return this.list.getByRole('link').and(this.page.getByTestId(/^articole-card-[a-z0-9-]+$/));
  }
  get articleBody(): Locator { return this.page.getByTestId('app-main'); }

  // Pagina unui articol: id-urile au forma articol-<slug-scurt>-..., deci le potrivim generic.
  get articleTitle(): Locator { return this.page.getByTestId(/^articol-[a-z0-9-]+-title$/); }
  get breadcrumbLink(): Locator { return this.page.getByTestId(/^articol-[a-z0-9-]+-breadcrumb-link-articole$/); }
  get articleImage(): Locator { return this.page.getByTestId(/^articol-[a-z0-9-]+-imagine-image$/); }
}
