import type { Locator, Page } from '@playwright/test';

/** Pauza (ms) petrecută pe fiecare pagină după navigare. Se setează din .env: PAGE_PAUSE_MS (0 = fără pauză). */
export const PAGE_PAUSE_MS = Number(process.env.PAGE_PAUSE_MS ?? 1000);

/** Metode ajutătoare comune: pauze, așteptări, scroll. Nu depinde de nicio altă pagină. */
export class CommonPages {
  constructor(private readonly page: Page) {}

  /** Stă `ms` milisecunde pe pagină (implicit PAGE_PAUSE_MS). Pauză voită, ca rularea să poată fi urmărită vizual. */
  async pause(ms: number = PAGE_PAUSE_MS): Promise<void> {
    if (ms > 0) await this.page.waitForTimeout(ms);
  }

  /**
   * Derulează pagina de sus în jos, frame cu frame (requestAnimationFrame), liniar, în exact `ms` milisecunde.
   * Dacă pagina încape în ecran, doar așteaptă `ms`. Înălțimea se recalculează la fiecare frame (lazy-load).
   */
  async smoothScroll(ms: number): Promise<void> {
    await this.page.evaluate(
      (duration) =>
        new Promise<void>((resolve) => {
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: Math.max(0, max) * t, behavior: 'instant' });
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      ms,
    );
  }

  /** Așteaptă încărcarea DOM-ului și a resurselor paginii. */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load');
  }

  /** Așteaptă să se liniștească rețeaua; nu pică testul dacă pagina are trafic continuu (analytics). */
  async waitForNetworkIdle(timeout = 5_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }

  async waitForVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async waitForUrl(url: RegExp | string, timeout = 10_000): Promise<void> {
    await this.page.waitForURL(url, { timeout });
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /** Scroll până jos, ca să se încarce imaginile lazy-load. */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /** Pagină „gata”: încărcată, rețea liniștită, apoi pauza standard. */
  async waitForPageReady(): Promise<void> {
    await this.waitForPageLoad();
    await this.waitForNetworkIdle();
    await this.pause();
  }
}
