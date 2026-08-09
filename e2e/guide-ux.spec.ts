import { test, expect } from '@playwright/test';

/**
 * Verificări UX după adaptările ghid / utilaje (Cuprins, Anexa, Bosch).
 */
test.describe('guide UX acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Nume').fill('Angajat');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri/panou-angajat');
  });

  test('Anexa 1: antet + Închide vizibile sub meniu', async ({ page }) => {
    await page.goto('/ingineri/panou-angajat?ref=guide&ghid=teren&tip=blat&doc=anexa1');
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
    const region = page.getByRole('region').filter({ hasText: /Anexa 1/i }).first();
    await expect(region.getByRole('button', { name: 'Închide' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Descarcă' })).toBeVisible();
  });

  test('închide + redeschide Măsurare → Cuprins (fără ch în URL)', async ({ page }) => {
    await page.goto('/ingineri/panou-angajat?ref=guide&tip=blat&ghid=teren&ch=field-blat-ch-5');
    await expect(page).toHaveURL(/ghid=teren/);
    // Închide ghidul
    await page.getByRole('button', { name: /Ghid măsurător — Măsurare/i }).click();
    await expect(page).not.toHaveURL(/ghid=teren/);
    await expect(page).not.toHaveURL(/[?&]ch=/);
    // Redeschide
    await page.getByRole('button', { name: /Ghid măsurător — Măsurare/i }).click();
    await expect(page).toHaveURL(/ghid=teren/);
    await expect(page).not.toHaveURL(/[?&]ch=/);
    await expect(page.getByText(/Cuprins/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('asset-uri Bosch artGRANIT pe site (PDF + pagină RO)', async ({ page }) => {
    const pdf = await page.request.get('/docs/equipment/bosch-gll-3-80/bosch-gll-3-80-manual-artgranit.pdf');
    expect(pdf.ok()).toBeTruthy();
    expect(Number(pdf.headers()['content-length'] || 0)).toBeGreaterThan(100_000);

    const pagePng = await page.request.get('/docs/equipment/bosch-gll-3-80/pages/page-03.png');
    expect(pagePng.ok()).toBeTruthy();

    const guidePng = await page.request.get(
      '/docs/operational-guide/field-guide/by-type/blat/pages/page-01.png',
    );
    expect(guidePng.ok()).toBeTruthy();
    expect(Number(guidePng.headers()['content-length'] || 0)).toBeGreaterThan(400_000);
  });

  test('Documentație completă deschide PDF general, nu pe tip', async ({ page }) => {
    await page.goto('/ingineri/panou-angajat?ref=guide&tip=blat&ghid=teren');
    await page.getByText(/Documentație completă/i).first().click();
    const frame = page.locator('iframe[title="Documentație completă"]');
    await expect(frame).toBeVisible({ timeout: 15000 });
    await expect(frame).toHaveAttribute(
      'src',
      /\/docs\/operational-guide\/field-guide\/Ghid-teren-masurare\.pdf$/,
    );
    const pdfRes = await page.request.get('/docs/operational-guide/field-guide/Ghid-teren-masurare.pdf');
    expect(pdfRes.ok()).toBeTruthy();
    expect(pdfRes.headers()['content-type'] || '').toMatch(/pdf/i);
  });

  test('utilaje GLL: avertisment doar la deschidere, nu după Închide', async ({ page }) => {
    await page.goto('/ingineri/panou-angajat?ref=equipment&device=eq-bosch-gll-3-80');
    await expect(page.getByText(/Avertisment Siguranță|Laser Clasa 2/i).first()).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /Înapoi la Mentenanță|Închide/i }).first().click();
    await expect(page.getByText(/Avertisment Siguranță|Laser Clasa 2/i)).toHaveCount(0, {
      timeout: 8000,
    });
  });
});
