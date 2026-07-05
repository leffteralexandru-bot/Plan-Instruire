import { test, expect } from '@playwright/test';

/** Viewport iPhone 13 — Chromium (fără WebKit, compatibil CI) */
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

async function loginAsAngajat(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Profil (email artGRANIT)').fill('angajat@artgranit.ro');
  await page.getByLabel('Parolă').fill('artgranit2026');
  await page.getByRole('button', { name: 'Conectare' }).click();
  await expect(page).toHaveURL('/ingineri/panou-angajat');
}

test.describe('layout mobil (iPhone 13)', () => {
  test('fără overflow orizontal pe panou angajat', async ({ page }) => {
    await loginAsAngajat(page);
    await expect(page.getByRole('heading', { name: 'Andrei Popescu' })).toBeVisible({
      timeout: 10_000,
    });

    const layout = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const main = document.querySelector('main');
      const bottomNav = document.querySelector('nav[aria-label="Navigare principală mobilă"]');
      const vw = window.innerWidth;

      return {
        scrollWidth: Math.max(html.scrollWidth, body.scrollWidth),
        clientWidth: html.clientWidth,
        mainWidth: main?.getBoundingClientRect().width ?? 0,
        bottomNavVisible: !!bottomNav && bottomNav.getBoundingClientRect().height > 0,
        vw,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 2);
    expect(layout.mainWidth).toBeGreaterThan(layout.vw * 0.82);
    expect(layout.bottomNavVisible).toBe(true);
  });

  test('bottom navigation cu touch targets ≥44px', async ({ page }) => {
    await loginAsAngajat(page);

    const bottomNav = page.getByRole('navigation', { name: 'Navigare principală mobilă' });
    await expect(bottomNav).toBeVisible();

    const targets = bottomNav.locator('a, button');
    const count = await targets.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test('modulele referință sunt pe o coloană pe mobil', async ({ page }) => {
    await loginAsAngajat(page);

    const moduleGrid = page.locator('.grid.grid-cols-1').first();
    await expect(moduleGrid).toBeVisible();

    const columnCount = await moduleGrid.evaluate((el) => {
      const cols = getComputedStyle(el).gridTemplateColumns.trim();
      if (!cols || cols === 'none') return 0;
      return cols.split(/\s+/).length;
    });

    expect(columnCount).toBe(1);
  });

  test('meniul hamburger se deschide pe mobil', async ({ page }) => {
    await loginAsAngajat(page);

    await page.getByRole('button', { name: 'Deschide meniul' }).click();
    await expect(page.getByRole('dialog', { name: 'Meniu aplicație' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Departamente' })).toBeVisible();
  });

  test('login folosește lățimea ecranului (card centrat, nu coloană îngustă forțată)', async ({ page }) => {
    await page.goto('/login');

    const card = page.locator('.neural-card').first();
    await expect(card).toBeVisible();

    const sizes = await page.evaluate(() => {
      const cardEl = document.querySelector('.neural-card');
      const vw = window.innerWidth;
      return {
        cardWidth: cardEl?.getBoundingClientRect().width ?? 0,
        vw,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });

    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 2);
    expect(sizes.cardWidth).toBeGreaterThan(sizes.vw * 0.75);
    expect(sizes.cardWidth).toBeLessThanOrEqual(sizes.vw);
  });
});
