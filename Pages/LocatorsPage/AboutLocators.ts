import type { Locator, Page } from '@playwright/test';

/** Locatori pagina About Us (/despre-noi/), după id. */
export class AboutLocators {
  constructor(private readonly page: Page) {}

  get title(): Locator { return this.page.getByTestId('about-title'); }
  get mission(): Locator { return this.page.getByTestId('about-misiune-titlu'); }
  get vision(): Locator { return this.page.getByTestId('about-viziune-titlu'); }
  get values(): Locator { return this.page.getByTestId('about-valori-titlu'); }
  get experience(): Locator { return this.page.getByTestId('about-experienta-si-parcurs-profesional-titlu'); }
  get whyUs(): Locator { return this.page.getByTestId('about-de-ce-sa-lucrezi-cu-titlu'); }
  get collaborators(): Locator { return this.page.getByTestId('about-colaboratorii-nostri-titlu'); }
  get howWeWork(): Locator { return this.page.getByTestId('about-cum-lucram-titlu'); }
  get howWeWorkSteps(): Locator { return this.page.getByTestId(/^about-cum-lucram-item-\d+$/); }
}
