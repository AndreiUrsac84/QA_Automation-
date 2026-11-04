import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ServiciiLocators } from './LocatorsPage';
import { ARTICLES, PAGES } from '../tests/fixtures/site';

/** Lista de servicii (/servicii/): carduri spre paginile serviciilor. */
export class ServiciiPage extends BasePage {
  readonly servicii: ServiciiLocators;

  constructor(page: Page) {
    super(page, '/servicii/');
    this.servicii = new ServiciiLocators(page);
  }

  /** Fiecare serviciu are un card vizibil, cu link spre /servicii/<slug>/. */
  async expectCards(): Promise<void> {
    for (const slug of ServiciiLocators.SERVICES) {
      const card = this.servicii.card(slug);
      await expect.soft(card, `cardul ${slug}`).toBeVisible();
      await expect.soft(card, `linkul cardului ${slug}`).toHaveAttribute('href', `/servicii/${slug}/`);
    }
  }
}

/** Pagina unui serviciu (/servicii/<slug>/). */
export class ServiciuPage extends BasePage {
  readonly servicii: ServiciiLocators;

  constructor(page: Page, readonly slug: (typeof ServiciiLocators.SERVICES)[number]) {
    super(page, `/servicii/${slug}/`);
    this.servicii = new ServiciiLocators(page);
  }

  /**
   * Titlu, descriere, cele două liste, cererea de ofertă (cu serviciul precompletat în Contact), linkul înapoi la listă
   * și celelalte 10 servicii în „Alte servicii”.
   */
  async expectComplete(): Promise<void> {
    const { slug } = this;
    const s = this.servicii;
    await expect.soft(s.backLink(slug), 'link înapoi la lista de servicii').toHaveAttribute('href', '/servicii/');
    await expect.soft(s.question(slug), 'întrebarea').toBeVisible();
    await expect.soft(s.serviceTitle(slug), 'titlul').toBeVisible();
    await expect.soft(s.serviceDescription(slug), 'descrierea').toBeVisible();
    await expect.soft(s.serviceIncludes(slug).locator('li').first(), 'ce include').toBeVisible();
    await expect.soft(s.serviceDocuments(slug).locator('li').first(), 'ce ne trimiți').toBeVisible();
    await expect.soft(s.offerLink(slug), 'cerere ofertă').toHaveAttribute('href', `/contact/?serviciu=${slug}`);
    await expect.soft(s.otherServicesTitle(slug), 'titlul „Alte servicii”').toBeVisible();
    for (const other of ServiciiLocators.SERVICES.filter((x) => x !== slug)) {
      await expect.soft(s.otherServiceLink(slug, other), `alt serviciu ${other}`).toHaveAttribute('href', `/servicii/${other}/`);
    }
  }

  /**
   * Linkurile din pagină care nu duc la o pagină cunoscută: specialitățile trebuie să fie în PAGES, articolele în
   * ARTICLES (sitemap), portofoliul la /portofoliu/ sau la o categorie /portofoliu/<categorie>/.
   * Specialitățile, articolele și portofoliul sunt opționale (lipsesc la unele servicii), deci absența lor nu e problemă.
   */
  async unknownLinks(): Promise<string[]> {
    const specialties = new Set<string>(PAGES.filter((p) => p.path.startsWith('/specialitati/')).map((p) => p.path));
    const articles = new Set(ARTICLES.map((a) => a.path));
    const portfolio = /^\/portofoliu\/([a-z0-9-]+\/)?$/;
    const groups: [string, Locator, (href: string) => boolean][] = [
      ['specialitate', this.servicii.specialtyLinks(this.slug), (h) => specialties.has(h)],
      ['articol', this.servicii.articleLinks(this.slug), (h) => articles.has(h)],
      ['portofoliu', this.servicii.portfolioLink(this.slug), (h) => portfolio.test(h)],
    ];
    const problems: string[] = [];
    for (const [kind, links, isKnown] of groups) {
      const found = await links.evaluateAll((els) => els.map((e) => ({ id: e.id, href: e.getAttribute('href') ?? '' })));
      for (const { id, href } of found) if (!isKnown(href)) problems.push(`${kind}: ${id} → ${href}`);
    }
    return problems;
  }
}
