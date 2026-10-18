import { test, expect, PAGES } from './fixtures/site';
import { CommonsLocators } from '../Pages/LocatorsPage';

/**
 * Regresie vizuală. Prima rulare creează referințele:
 *   npm run test:visual:update
 * Rulările următoare compară cu referința și semnalează diferențe > 2%.
 * Rulează doar în proiectele visual-desktop / visual-mobile (npm run test:visual).
 * Referințele depind de OS (fonturi) și se păstrează separat, în tests/__screenshots__/<platform>/.
 * Referințele Linux (cele folosite în CI) trebuie generate pe Linux, de exemplu într-un container Playwright.
 */
test.describe('Regresie vizuală @visual', () => {
  for (const p of PAGES) {
    test(`snapshot ${p.path}`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'load' });
      // bannerul de cookie-uri acoperă conținutul paginii; e testat separat în navigation.spec.ts
      const commons = new CommonsLocators(page);
      await commons.cookieRefuse.click();
      await expect(commons.cookieBanner).toBeHidden();
      await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });
      await expect(page).toHaveScreenshot(`${p.name.replace(/\W+/g, '-').toLowerCase()}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        mask: [page.locator('iframe'), page.locator('[class*="date"], time')],
      });
    });
  }
});
