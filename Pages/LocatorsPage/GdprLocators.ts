import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Politica de confidențialitate (/gdpr/), după id. */
export class GdprLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('gdpr-title'); }
  /** Rândul cu „Ultima actualizare”. */
  get lastUpdated(): Locator { return this.page.getByTestId('gdpr-header-text-2'); }
  /** Titlul (H2) secțiunii numerotate (1–7); id-ul are forma gdpr-sectiune-<n>-<slug>. */
  sectionTitle(n: number): Locator { return this.page.getByTestId(new RegExp(`^gdpr-sectiune-${n}-[a-z0-9-]+$`)); }
  // linkurile din text nu mai au id (release-ul din 2026-10): după rol și nume
  get emailLink(): Locator { return this.page.getByTestId('gdpr').getByRole('link', { name: 'contact@dauron-trust.com' }).first(); }
  get anspdcpLink(): Locator { return this.page.getByTestId('gdpr').getByRole('link', { name: /ANSPDCP/ }); }
}
