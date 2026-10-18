import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { AboutLocators } from './LocatorsPage';

export class AboutPage extends BasePage {
  readonly about: AboutLocators;

  constructor(page: Page) {
    super(page, '/despre-noi/');
    this.about = new AboutLocators(page);
  }

  /** Verifică prezența tuturor secțiunilor paginii. */
  async expectSections(): Promise<void> {
    const sections = [
      this.about.mission, this.about.vision, this.about.values, this.about.experience,
      this.about.whyUs, this.about.collaborators, this.about.howWeWork,
    ];
    for (const s of sections) await expect.soft(s).toBeVisible();
  }
}
