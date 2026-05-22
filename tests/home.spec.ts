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

test('role filter shows lane labels (Top / Jungle / Mid / Bot / Support)', async ({ page }) => {
  await page.goto('/');

  const select = page.locator('select');
  await expect(select).toBeVisible();
  const options = await select.locator('option').allInnerTexts();
  expect(options).toEqual(['All roles', 'Top', 'Jungle', 'Mid', 'Bot', 'Support']);
});

test('filtering by lane only shows champions where that lane is non-off-meta', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('ul a[href^="/champion/"]');
  const totalCount = await cards.count();

  // Pick Jungle — should narrow the list and never include obvious non-junglers
  // like Annie or Caitlyn (both ≪5% in JUNGLE).
  await page.locator('select').selectOption('JUNGLE');

  const jungleCount = await cards.count();
  expect(jungleCount).toBeGreaterThan(0);
  expect(jungleCount).toBeLessThan(totalCount);

  // Hrefs include the forwarded ?role=JUNGLE; strip the query for membership checks.
  const ids = await cards.evaluateAll((els) =>
    els.map((e) => {
      const href = (e as HTMLAnchorElement).getAttribute('href') ?? '';
      return href.split('?')[0];
    })
  );
  expect(ids).not.toContain('/champion/Annie');
  expect(ids).not.toContain('/champion/Caitlyn');

  // Real junglers should be present.
  expect(ids).toContain('/champion/LeeSin');
  expect(ids).toContain('/champion/MasterYi');
});

test('lane filter combines with name search', async ({ page }) => {
  await page.goto('/');

  // "Lee Sin" is a unique substring match.
  await page.getByLabel(/Search champion/i).fill('Lee Sin');
  await page.locator('select').selectOption('JUNGLE');

  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', /^\/champion\/LeeSin(\?|$)/);

  // Same search but filtering Support — Lee Sin is not a support, expect zero results.
  await page.locator('select').selectOption('UTILITY');
  await expect(cards).toHaveCount(0);
});

test('selected lane is forwarded to the champion page and pre-selects the role tab', async ({
  page
}) => {
  await page.goto('/');
  await page.locator('select').selectOption('JUNGLE');

  // Cards now link with ?role=jungle (lowercase slug, not the internal Riot key)
  const leeSinCard = page.locator('ul a[href="/champion/LeeSin?role=jungle"]');
  await expect(leeSinCard).toBeVisible();
  await leeSinCard.click();

  // On the champion page the role tab labeled Jungle is the active one.
  await expect(page).toHaveURL(/\/champion\/LeeSin\?role=jungle$/);
  const jungleTab = page.getByRole('button', { name: /^Jungle$/ });
  await expect(jungleTab).toHaveClass(/border-hex-gold/);
});

test('support slug pre-selects the Support tab (slug → Riot key mapping)', async ({ page }) => {
  // Direct URL hit — verifies the slug→Lane decoder, no home navigation needed.
  await page.goto('/champion/Pyke?role=support');
  const supportTab = page.getByRole('button', { name: /^Support$/ });
  await expect(supportTab).toBeVisible();
  await expect(supportTab).toHaveClass(/border-hex-gold/);
});

test('unknown role slug falls back to the default tab', async ({ page }) => {
  await page.goto('/champion/LeeSin?role=carry');
  // Lee Sin's most popular role is Jungle, which should be selected by default.
  const jungleTab = page.getByRole('button', { name: /^Jungle$/ });
  await expect(jungleTab).toHaveClass(/border-hex-gold/);
});

test('home page link without lane filter goes to default role tab', async ({ page }) => {
  await page.goto('/');
  // No lane selected → href has no ?role
  const anyCard = page.locator('ul a[href="/champion/LeeSin"]').first();
  await expect(anyCard).toBeVisible();
});

test('robots.txt is served', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('Sitemap:');
});
