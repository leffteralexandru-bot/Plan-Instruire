import { test, expect, devices } from '@playwright/test';

/**
 * Emulare telefon — Anexa + PDF + întoarcere Repository.
 * (Nu înlocuiește un test pe aparat fizic, dar prinde regresii de layout mobil.)
 */
test.use({ ...devices['Pixel 7'] });

test.describe('mobil — ghid / PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Nume').fill('Angajat');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri/panou-angajat');
  });

  test('Anexa 1: antet + Închide pe viewport mobil', async ({ page }) => {
    await page.goto('/ingineri/panou-angajat?ref=guide&ghid=teren&tip=blat&doc=anexa1');
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
    const region = page.getByRole('region').filter({ hasText: /Anexa 1/i }).first();
    await expect(region.getByRole('button', { name: 'Închide' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Descarcă' })).toBeVisible();
  });

  test('PDF ghid teren răspunde ca application/pdf', async ({ page }) => {
    const pdf = await page.request.get('/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf');
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()['content-type'] || '').toMatch(/pdf/i);
  });

  test('variantă -sm pentru pagină ghid există', async ({ page }) => {
    const sm = await page.request.get(
      '/docs/operational-guide/field-guide/by-type/blat/pages/page-01-sm.png',
    );
    expect(sm.ok()).toBeTruthy();
    expect(Number(sm.headers()['content-length'] || 0)).toBeGreaterThan(20_000);
  });

  test('Documentație tehnică → ← înapoi pe mobil', async ({ page }) => {
    await page.goto(
      '/ingineri/panou-angajat?ref=repo&from=guide&ghid=teren&tip=blat&doc=doc-tehnica',
    );
    const back = page.getByTestId('repo-guide-back');
    await expect(back).toBeVisible({ timeout: 15000 });
    await back.click();
    await expect(page).toHaveURL(/ref=guide/);
  });
});
