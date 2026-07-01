import { test, expect } from '@playwright/test';

test.describe('artGRANIT login', () => {
  test('pagina login afișează brand artGRANIT', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByAltText('artGRANIT')).toBeVisible();
    await expect(page.getByText('Plan de Instruire')).toBeVisible();
  });

  test('login stagiar → redirect automat plan ingineri', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Alexandru Popescu').click();
    await expect(page).toHaveURL('/ingineri');
    await expect(page.getByRole('heading', { name: 'Module pe Săptămâni' })).toBeVisible({ timeout: 10000 });
  });

  test('login admin → hub departamente și plan în curând producție', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Elena Vasilescu').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Plan Instruire/i })).toBeVisible();
    await page.getByRole('heading', { name: 'Producție' }).click();
    await expect(page).toHaveURL('/productie/in-curand');
    await expect(page.getByText('Plan în pregătire')).toBeVisible();
  });

  test('login admin → panou HR ingineri', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Elena Vasilescu').click();
    await page.goto('/ingineri/admin');
    await expect(page.getByRole('heading', { name: /Panou Admin/i })).toBeVisible();
  });
});
