import type { Locator, Page } from '@playwright/test';

/**
 * Locatori pentru serviciile site-ului, după id.
 * - Pagina de listă (/servicii/): un card per serviciu, id `servicii-card-<slug>`, grupate în „Proiectare” și „Asistență”.
 * - Pagina unui serviciu (/servicii/<slug>/): elementele au forma `servicii-<slug>-<element>`.
 */
export class ServiciiLocators {
  /** Serviciile din listă (slug = ultimul segment din /servicii/<slug>/). */
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

  // ── Lista de servicii (/servicii/) ──────────────────────────────────────────────────────────────────────────
  get title(): Locator { return this.page.getByTestId('servicii-title'); }
  get intro(): Locator { return this.page.getByTestId('servicii-intro'); }
  get price(): Locator { return this.page.getByTestId('servicii-pret'); }
  get note(): Locator { return this.page.getByTestId('servicii-note'); }
  get collaboration(): Locator { return this.page.getByTestId('servicii-colaborare'); }

  get designGroupTitle(): Locator { return this.page.getByTestId('servicii-grupa-proiectare-titlu'); }
  get assistanceGroupTitle(): Locator { return this.page.getByTestId('servicii-grupa-asistenta-titlu'); }
  /** Cardul unui serviciu (link spre pagina lui). */
  card(slug: string): Locator { return this.page.getByTestId(`servicii-card-${slug}`); }

  get finalTitle(): Locator { return this.page.getByTestId('servicii-final-titlu'); }
  get finalContactLink(): Locator { return this.page.getByTestId('servicii-final-link-contact'); }

  // ── Pagina unui serviciu (/servicii/<slug>/) ────────────────────────────────────────────────────────────────
  backLink(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-inapoi`); }
  /** Întrebarea de deasupra titlului („Vreau să construiesc o casă”). */
  question(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-intrebare`); }
  serviceTitle(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-titlu`); }
  serviceDescription(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-descriere`); }
  /** Lista „ce include proiectul”. */
  serviceIncludes(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-lista-include`); }
  /** Lista „ce ne trimiți”. */
  serviceDocuments(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-lista-documente`); }
  offerLink(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-link-oferta`); }
  /** „Vezi proiecte de acest tip” – lipsește la unele servicii (asistență pe șantier, obținerea actelor, clădiri publice). */
  portfolioLink(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-link-portofoliu`); }

  // Linkurile din pagina unui serviciu (specialitățile și articolele lipsesc la serviciile de asistență / colaborare)
  specialtyLinks(slug: string): Locator { return this.page.getByTestId(new RegExp(`^servicii-${slug}-specialitate-[a-z0-9-]+$`)); }
  articleLinks(slug: string): Locator { return this.page.getByTestId(new RegExp(`^servicii-${slug}-articol-[a-z0-9-]+$`)); }

  /** Secțiunea „Alte servicii” de la finalul paginii: titlul și câte un link spre fiecare celălalt serviciu. */
  otherServicesTitle(slug: string): Locator { return this.page.getByTestId(`servicii-${slug}-altele-titlu`); }
  otherServiceLink(slug: string, other: string): Locator { return this.page.getByTestId(`servicii-${slug}-altul-${other}`); }
}
