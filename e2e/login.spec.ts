import { test, expect } from '@playwright/test';

test.describe('artGRANIT login', () => {
  test('pagina login afișează brand artGRANIT', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByAltText('artGRANIT')).toBeVisible();
    await expect(page.getByText('Plan de Instruire')).toBeVisible();
    await expect(page.getByText('Profile organizaționale')).toBeVisible();
  });

  test('login angajat → redirect automat plan ingineri', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Profil (email artGRANIT)').fill('a.popescu@artgranit.ro');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/ingineri');
    await expect(page.getByRole('heading', { name: 'Module pe Săptămâni' })).toBeVisible({ timeout: 10000 });
  });

  test('login HR → hub departamente și plan în curând producție', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Profil (email artGRANIT)').fill('e.vasilescu@artgranit.ro');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Plan Instruire/i })).toBeVisible();
    await page.getByRole('heading', { name: 'Producție' }).click();
    await expect(page).toHaveURL('/productie/in-curand');
    await expect(page.getByText('Plan în pregătire')).toBeVisible();
  });

  test('login HR → panou HR ingineri', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Profil (email artGRANIT)').fill('e.vasilescu@artgranit.ro');
    await page.getByLabel('Parolă').fill('artgranit2026');
    await page.getByRole('button', { name: 'Conectare' }).click();
    await page.goto('/ingineri/admin');
    await expect(page.getByRole('heading', { name: /Panou Admin/i })).toBeVisible();
  });
});
