import type { Locator, Page } from '@playwright/test';

/**
 * Locatori pagina Servicii (/servicii/), după id.
 * Fiecare serviciu e o secțiune cu id-ul <slug>, iar elementele ei au forma servicii-<slug>-<element>.
 */
export class ServiciiLocators {
  /** Serviciile listate în cuprins (slug = id-ul secțiunii și ancora din cuprins). */
  static readonly SERVICES = [
    'case-vile',
    'intrare-in-legalitate',
    'extinderi-mansardari',
    'consolidari-reabilitari',
    'hale-industriale',
    'cladiri-publice-comerciale',
    'edilitare',
    'anexe-garaje-garduri',
    'obtinere-acte',
    'asistenta-santier',
    'colaborare-firme',
  ] as const;

  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('servicii-title'); }
  get intro(): Locator { return this.page.getByTestId('servicii-intro'); }
  get price(): Locator { return this.page.getByTestId('servicii-pret'); }

  // Cuprinsul: grupa „Proiectare” și grupa „Asistență”
  get toc(): Locator { return this.page.getByTestId('servicii-cuprins'); }
  tocLink(slug: string): Locator { return this.page.getByTestId(`servicii-cuprins-link-${slug}`); }
  get designGroupTitle(): Locator { return this.page.getByTestId('servicii-grupa-proiectare-titlu'); }
  get assistanceGroupTitle(): Locator { return this.page.getByTestId('servicii-grupa-asistenta-titlu'); }

  // Secțiunea unui serviciu
  section(slug: string): Locator { return this.page.getByTestId(slug); }
  serviceTitle(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-titlu`); }
  serviceDescription(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-descriere`); }
  /** Lista „ce include proiectul”. */
  serviceIncludes(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-lista-include`); }
  /** Lista „ce ne trimiți”. */
  serviceDocuments(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-lista-documente`); }
  offerLink(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-link-oferta`); }
  backToTopLink(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-link-sus`); }

  // Linkurile din secțiuni, pe toate serviciile (id-ul are forma servicii-<slug>-specialitate-<specialitate> etc.)
  get specialtyLinks(): Locator { return this.page.getByTestId(/^servicii-[a-z0-9-]+-specialitate-[a-z0-9-]+$/); }
  get articleLinks(): Locator { return this.page.getByTestId(/^servicii-[a-z0-9-]+-articol-[a-z0-9-]+$/); }
  get portfolioLinks(): Locator { return this.page.getByTestId(/^servicii-[a-z0-9-]+-link-portofoliu$/); }

  // Finalul paginii
  get finalTitle(): Locator { return this.page.getByTestId('servicii-final-titlu'); }
  get finalContactLink(): Locator { return this.page.getByTestId('servicii-final-link-contact'); }
}
