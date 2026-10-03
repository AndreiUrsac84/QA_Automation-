import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { CommonsLocators } from './LocatorsPage';
import { CommonPages } from './CommonPages';
import { brokenImages } from '../tests/fixtures/site';

/** Metode comune tuturor paginilor: navigare, meniu, banner cookie-uri, imagini rupte. */
export class BasePage {
  readonly commons: CommonsLocators;
  readonly helpers: CommonPages;

  constructor(readonly page: Page, readonly path: string = '/') {
    this.commons = new CommonsLocators(page);
    this.helpers = new CommonPages(page);
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
    await this.commons.navLink(label).click();
  }

  async expectNavLink(label: string, href: RegExp): Promise<void> {
    await expect(this.commons.navLink(label), `link "${label}"`).toHaveAttribute('href', href);
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
