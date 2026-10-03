import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ArticoleLocators } from './LocatorsPage';

export class ArticolePage extends BasePage {
  readonly articole: ArticoleLocators;

  constructor(page: Page) {
    super(page, '/articole/');
    this.articole = new ArticoleLocators(page);
  }

  /** URL-urile unice ale articolelor din listă (fără pagina de listă și fără ancore). */
  async articleUrls(): Promise<string[]> {
    const hrefs = await this.page.locator('a[href*="/articole/"]').evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).href.split('#')[0]).filter((h) => !/\/articole\/?$/.test(h)));
    return [...new Set(hrefs)];
  }

  /** Deschide un articol și întoarce problemele găsite (listă goală = articol valid). */
  async checkArticle(href: string): Promise<string[]> {
    const problems: string[] = [];
    const res = await this.page.goto(href);
    if (!res || res.status() >= 400) return [`${res?.status()} ${href}`];
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
