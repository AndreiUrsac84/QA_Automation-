import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ServiciiLocators } from './LocatorsPage';
import { ARTICLES, PAGES, PORTFOLIO_CATEGORIES } from '../tests/fixtures/site';

export class ServiciiPage extends BasePage {
  readonly servicii: ServiciiLocators;

  constructor(page: Page) {
    super(page, '/servicii/');
    this.servicii = new ServiciiLocators(page);
  }

  /** Fiecare serviciu: link în cuprins spre secțiunea lui, titlu, descriere, cele două liste și linkurile ofertă / sus. */
  async expectServices(): Promise<void> {
    for (const slug of ServiciiLocators.SERVICES) {
      const s = this.servicii;
      await expect.soft(s.tocLink(slug), `cuprins → ${slug}`).toHaveAttribute('href', `#${slug}`);
      await expect.soft(s.section(slug), `secțiunea ${slug}`).toBeAttached();
      await expect.soft(s.serviceTitle(slug), `titlul ${slug}`).toBeVisible();
      await expect.soft(s.serviceDescription(slug), `descrierea ${slug}`).toBeVisible();
      await expect.soft(s.serviceIncludes(slug), `ce include ${slug}`).toBeVisible();
      await expect.soft(s.serviceDocuments(slug), `ce ne trimiți ${slug}`).toBeVisible();
      await expect.soft(s.offerLink(slug), `cerere ofertă ${slug}`).toHaveAttribute('href', `/contact/?serviciu=${slug}`);
      await expect.soft(s.backToTopLink(slug), `înapoi la cuprins ${slug}`).toHaveAttribute('href', '#servicii-cuprins');
    }
  }

  /**
   * Linkurile din secțiuni care nu duc la o pagină cunoscută: specialitățile trebuie să fie în PAGES, articolele în
   * ARTICLES (sitemap), portofoliul la /portofoliu/ sau o categorie din PORTFOLIO_CATEGORIES.
   */
  async unknownLinks(): Promise<string[]> {
    const specialties = new Set<string>(PAGES.filter((p) => p.path.startsWith('/specialitati/')).map((p) => p.path));
    const articles = new Set(ARTICLES.map((a) => a.path));
    const portfolio = new Set<string>(['/portofoliu/', ...PORTFOLIO_CATEGORIES.map((c) => c.path)]);
    const groups: [string, Locator, Set<string>][] = [
      ['specialitate', this.servicii.specialtyLinks, specialties],
      ['articol', this.servicii.articleLinks, articles],
      ['portofoliu', this.servicii.portfolioLinks, portfolio],
    ];
    const problems: string[] = [];
    for (const [kind, links, known] of groups) {
      const found = await links.evaluateAll((els) => els.map((e) => ({ id: e.id, href: e.getAttribute('href') ?? '' })));
      if (found.length === 0) problems.push(`niciun link de tip ${kind}`);
      for (const { id, href } of found) if (!known.has(href)) problems.push(`${kind}: ${id} → ${href}`);
    }
    return problems;
  }
}
