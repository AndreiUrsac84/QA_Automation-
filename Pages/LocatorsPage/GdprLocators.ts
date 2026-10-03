import type { Locator, Page } from '@playwright/test';

/** Locatori pagina Politica de confidențialitate (/gdpr/). */
export class GdprLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByRole('heading', { level: 1, name: 'Politica de confidențialitate' }); }
  get lastUpdated(): Locator { return this.page.getByText(/Ultima actualizare/); }
  /** Secțiunea numerotată, ex. section('4.') pentru „4. Drepturile tale”. */
  section(prefix: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: new RegExp(`^${prefix.replace('.', '\\.')}`) });
  }
  get emailLink(): Locator { return this.page.getByRole('link', { name: 'contact@dauron-trust.com' }).first(); }
  get anspdcpLink(): Locator { return this.page.getByRole('link', { name: /Autoritatea Națională de Supraveghere/ }); }
}
