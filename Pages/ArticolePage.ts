import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ArticoleLocators } from './LocatorsPage';

export class ArticolePage extends BasePage {
  readonly articole: ArticoleLocators;

  constructor(page: Page) {
    super(page, '/articole/');
    this.articole = new ArticoleLocators(page);
  }

  /**
   * URL-urile unice ale tuturor articolelor (fără ancore), apelat pe /articole/. Din release-ul din 2026-10, /articole/
   * arată doar o parte din articole, restul sunt pe paginile de subiect: le deschide pe rând, deci pagina rămâne pe
   * ultimul subiect.
   */
  async articleUrls(): Promise<string[]> {
    const hrefs = await this.cardUrls(this.articole.articleLinks);
    const subjects = await this.articole.subjectLinks.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const subject of new Set(subjects)) {
      await this.page.goto(subject);
      hrefs.push(...(await this.cardUrls(this.articole.subjectArticleLinks)));
    }
    return [...new Set(hrefs)];
  }

  private async cardUrls(cards: Locator): Promise<string[]> {
    // evaluateAll nu așteaptă: fără asta lista poate fi goală dacă cardurile nu sunt încă randate
    await cards.first().waitFor();
    return cards.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href.split('#')[0]));
  }

  /** Deschide un articol și întoarce problemele găsite (listă goală = articol valid). */
  async checkArticle(href: string): Promise<string[]> {
    const problems: string[] = [];
    const res = await this.page.goto(href);
    if (!res || res.status() >= 400) return [`${res?.status()} ${href}`];
    if ((await this.articole.articleTitle.count()) !== 1) problems.push(`titlu articol (id) != 1 pe ${href}`);
    if ((await this.commons.h1.count()) !== 1) problems.push(`H1 != 1 pe ${href}`);
    const words = (await this.articole.articleBody.innerText()).split(/\s+/).length;
    if (words < 150) problems.push(`conținut prea scurt (${words} cuvinte) pe ${href}`);
    const desc = await this.page.locator('meta[name="description"]').getAttribute('content');
    if (!desc) problems.push(`fără meta description pe ${href}`);
    const broken = await this.brokenImages();
    if (broken.length) problems.push(`imagini rupte pe ${href}: ${broken.join(', ')}`);
    return problems;
  }
}
