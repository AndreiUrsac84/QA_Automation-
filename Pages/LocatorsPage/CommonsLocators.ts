import type { Locator, Page } from '@playwright/test';

/** Locatori comuni tuturor paginilor: header/meniu, footer, banner cookie-uri, WhatsApp. */
export class CommonsLocators {
  constructor(private readonly page: Page) {}

  // Header / meniu
  get header(): Locator { return this.page.getByRole('banner'); }
  get nav(): Locator { return this.page.getByRole('navigation'); }
  get logo(): Locator { return this.page.getByRole('link', { name: /DAURON TRUST/i }).first(); }
  navLink(label: string): Locator { return this.nav.getByRole('link', { name: label, exact: true }); }
  get h1(): Locator { return this.page.getByRole('heading', { level: 1 }); }

  // Footer
  get footer(): Locator { return this.page.locator('footer'); }
  get footerGdprLink(): Locator {
    return this.footer.getByRole('link', { name: /confiden|GDPR/i }).first();
  }
  get copyright(): Locator { return this.page.getByRole('link', { name: /© \d{4} DAURON TRUST SRL/ }); }

  // WhatsApp (buton plutitor)
  get whatsappButton(): Locator { return this.page.getByRole('link', { name: 'Contact pe WhatsApp' }); }

  // Banner cookie-uri (GDPR)
  get cookieAccept(): Locator { return this.page.getByRole('button', { name: 'Accept', exact: true }); }
  get cookieRefuse(): Locator { return this.page.getByRole('button', { name: 'Refuz', exact: true }); }
  get cookiePolicyLink(): Locator { return this.page.getByRole('link', { name: /Politica de/i }).first(); }
}
