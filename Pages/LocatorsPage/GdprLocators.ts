import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Politica de confidențialitate (/gdpr/), după id. */
export class GdprLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('gdpr-title'); }
  /** Rândul cu „Ultima actualizare”. */
  get lastUpdated(): Locator { return this.page.getByTestId('gdpr-header-text-2'); }
  /** Titlul secțiunii numerotate (1–7); id-ul are forma gdpr-<n>-<slug>-titlu. */
  sectionTitle(n: number): Locator { return this.page.getByTestId(new RegExp(`^gdpr-${n}-[a-z0-9-]+-titlu$`)); }
  get emailLink(): Locator { return this.page.getByTestId('gdpr-1-operatorul-de-date-link-contact-dauron-trust-com'); }
  get anspdcpLink(): Locator {
    return this.page.getByTestId('gdpr-4-drepturile-tale-link-autoritatea-nationala-de-supraveghere');
  }
}
