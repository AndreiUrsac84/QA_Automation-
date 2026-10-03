import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { GdprLocators } from './LocatorsPage';

export class GdprPage extends BasePage {
  readonly gdpr: GdprLocators;

  constructor(page: Page) {
    super(page, '/gdpr/');
    this.gdpr = new GdprLocators(page);
  }

  async expectSections(): Promise<void> {
    await expect(this.gdpr.title).toBeVisible();
    for (const n of ['1.', '2.', '3.', '4.', '5.', '6.', '7.']) {
      await expect.soft(this.gdpr.section(n), `secțiunea ${n}`).toBeVisible();
    }
  }
}
