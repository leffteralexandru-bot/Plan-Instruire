import { test, expect } from '@playwright/test';

const FIELD_DEEP =
  '/ingineri/panou-angajat?ref=guide&ghid=teren&tip=scara&doc=anexa1';
const DESIGN_DEEP =
  '/ingineri/panou-angajat?ref=guide&ghid=proiectare&tip=blat&doc=anexa1';

test.describe('artGRANIT guide deep-link', () => {
  test('fără sesiune → login cu next → angajat → ghid măsurare + Anexa 1', async ({ page }) => {
    await page.goto(FIELD_DEEP);
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel('Nume').fill('Angajat');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL(/\/ingineri\/panou-angajat\?.*doc=anexa1/);
    await expect(page.getByText(/Anexa 1/i).first()).toBeVisible({ timeout: 15000 });
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
});
