import { expect, test } from '@playwright/test';

test('home page renders champion grid (SSR)', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Champions of the Rift/i })).toBeVisible();
  await expect(page.locator('ul a[href^="/champion/"]').first()).toBeVisible();
});

test('search input filters champions', async ({ page }) => {
  await page.goto('/');

  const search = page.getByLabel(/Search champion/i);
  await search.fill('amumu');

  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', '/champion/Amumu');
});

test('robots.txt is served', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('Sitemap:');
});
