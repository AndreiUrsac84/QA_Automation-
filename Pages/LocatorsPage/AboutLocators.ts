import type { Locator, Page } from '@playwright/test';

/** Locatori pagina About Us (/about/). */
export class AboutLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByRole('heading', { level: 1 }); }
  get mission(): Locator { return this.page.getByRole('heading', { name: 'Misiune' }); }
  get vision(): Locator { return this.page.getByRole('heading', { name: 'Viziune' }); }
  get values(): Locator { return this.page.getByRole('heading', { name: 'Valori' }); }
  get experience(): Locator { return this.page.getByRole('heading', { name: /Experiență și parcurs profesional/ }); }
  get whyUs(): Locator { return this.page.getByRole('heading', { name: /De ce să lucrezi cu DAURON TRUST/ }); }
  get collaborators(): Locator { return this.page.getByRole('heading', { name: 'Colaboratorii noștri' }); }
  get howWeWork(): Locator { return this.page.getByRole('heading', { name: 'Cum lucrăm' }); }
}
