import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { CommonsLocators } from './LocatorsPage';
import { brokenImages } from '../tests/fixtures/site';

/** Metode comune tuturor paginilor: navigare, meniu, banner cookie-uri, imagini rupte. */
export class BasePage {
  readonly commons: CommonsLocators;

  constructor(readonly page: Page, readonly path: string = '/') {
    this.commons = new CommonsLocators(page);
  }

  async open(): Promise<Response | null> {
    return this.page.goto(this.path);
  }

  /** Apasă „Accept” pe bannerul de cookie-uri, dacă este afișat. */
  async acceptCookies(): Promise<void> {
    if (await this.commons.cookieAccept.isVisible().catch(() => false)) {
      await this.commons.cookieAccept.click();
    }
  }

  async clickNav(label: string): Promise<void> {
    await this.commons.navLink(label).or(this.commons.header.getByRole('link', { name: label, exact: true })).first().click();
  }

  async expectNavLink(label: string, href: RegExp): Promise<void> {
    const link = this.commons.navLink(label)
      .or(this.commons.header.getByRole('link', { name: label, exact: true }))
      .first();
    await expect(link, `link "${label}"`).toHaveAttribute('href', href);
  }

  async clickLogo(): Promise<void> {
    await this.commons.logo.click();
  }

  async expectFooterGdprLink(): Promise<void> {
    await expect(this.commons.footerGdprLink).toHaveAttribute('href', /\/gdpr\/?$/);
  }

  async brokenImages(): Promise<string[]> {
    return brokenImages(this.page);
  }
}
