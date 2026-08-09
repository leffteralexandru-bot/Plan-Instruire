import { test, expect } from '@playwright/test';

const FIELD_DEEP =
  '/ingineri/panou-angajat?ref=guide&ghid=teren&tip=scara&doc=anexa1';
const DESIGN_DEEP =
  '/ingineri/panou-angajat?ref=guide&ghid=proiectare&tip=blat&doc=anexa1';
const PROLINER_DEEP =
  '/ingineri/panou-angajat?ref=equipment&device=eq-proliner&from=guide&ghid=teren&tip=scara';

test.describe('artGRANIT guide deep-link', () => {
  test('fără sesiune → login cu next → angajat → ghid măsurare + Anexa 1', async ({ page }) => {
    await page.goto(FIELD_DEEP);
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel('Nume').fill('Angajat');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL(/\/ingineri\/panou-angajat\?.*doc=anexa1/);
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('region').getByRole('button', { name: 'Închide' })).toBeVisible();
    await expect(page.getByRole('region').getByRole('button', { name: 'Descarcă' })).toBeVisible();
    await expect(page.getByRole('region').getByRole('button', { name: 'Trimite' })).toBeVisible();
    await expect(page.getByText('artGRANIT').first()).toBeVisible();
    await expect(page.getByText('Panou Angajat').first()).toBeVisible();
  });

  test('admin pe deep-link măsurare → preview ghid, nu cardul „doar Angajat”', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Nume').fill('Lefter');
    await page.getByLabel('Parolă').fill('122312');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri/admin');

    await page.goto(FIELD_DEEP);
    await expect(page).toHaveURL(/doc=anexa1/);
    await expect(page.getByText(/Documentație ghid|preview|Vedere ca angajat/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Această pagină este pentru conturile cu rol')).toHaveCount(0);
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('admin pe deep-link proiectare → deschide Ghid Proiectare + Anexa 1', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Nume').fill('Lefter');
    await page.getByLabel('Parolă').fill('122312');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri/admin');

    await page.goto(DESIGN_DEEP);
    await expect(page).toHaveURL(/ghid=proiectare/);
    await expect(page).toHaveURL(/doc=anexa1/);
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('admin pe link Proliner → Mentenanță + carte + Înapoi la ghid', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Nume').fill('Lefter');
    await page.getByLabel('Parolă').fill('122312');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri/admin');

    await page.goto(PROLINER_DEEP);
    await expect(page).toHaveURL(/ref=equipment/);
    await expect(page).toHaveURL(/device=eq-proliner/);
    await expect(page).toHaveURL(/from=guide/);
    await expect(page.getByText(/carte utilaj|PROLINER|Proliner|Mentenanță/i).first()).toBeVisible({
      timeout: 15000,
    });
    // Meniul de sus (ca în panou) rămâne vizibil — cartea e în containerul Mentenanță
    await expect(page.getByText('artGRANIT').first()).toBeVisible();
    await expect(page.getByText('Panou Angajat').first()).toBeVisible();
    const book = page.getByRole('region', { name: /Manual|Proliner|PROLINER/i });
    await expect(book.getByRole('button', { name: 'Descarcă' })).toBeVisible();
    await expect(book.getByRole('button', { name: 'Trimite' })).toBeVisible();
    const back = book.getByRole('button', { name: /Înapoi la ghid măsurare/i });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/ref=guide/);
    await expect(page).toHaveURL(/ghid=teren/);
    await expect(page).toHaveURL(/tip=scara/);
    await expect(page).not.toHaveURL(/device=/);
  });
});
