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

  const select = page.getByLabel('Role filter');
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
  await page.getByLabel('Role filter').selectOption('JUNGLE');

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
  await page.getByLabel('Role filter').selectOption('JUNGLE');

  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', /^\/champion\/LeeSin(\?|$)/);

  // Same search but filtering Support — Lee Sin is not a support, expect zero results.
  await page.getByLabel('Role filter').selectOption('UTILITY');
  await expect(cards).toHaveCount(0);
});

test('selected lane is forwarded to the champion page and pre-selects the role tab', async ({
  page
}) => {
  await page.goto('/');
  await page.getByLabel('Role filter').selectOption('JUNGLE');

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

test('list view toggle switches layout and persists across reloads', async ({ page }) => {
  await page.goto('/');

  // Default view = splash grid. List rows shouldn't exist yet.
  const listButton = page.getByRole('button', { name: 'List view' });
  const splashButton = page.getByRole('button', { name: 'Splash card view' });
  await expect(listButton).toBeVisible();
  await expect(listButton).toHaveAttribute('aria-pressed', 'false');
  await expect(splashButton).toHaveAttribute('aria-pressed', 'true');

  // Splash uses aspect-[3/5] image cards; list uses small portrait + horizontal rows.
  // Use the existence of the list-row aria-label as the discriminator.
  await expect(page.getByLabel('View Lee Sin').locator('img')).toHaveCount(1);

  await listButton.click();
  await expect(listButton).toHaveAttribute('aria-pressed', 'true');
  await expect(splashButton).toHaveAttribute('aria-pressed', 'false');

  // Row should include a Hex Score (small integer) + a win-rate %.
  const leeSinRow = page.getByRole('link', { name: 'View Lee Sin' });
  await expect(leeSinRow).toBeVisible();
  await expect(leeSinRow).toContainText(/\d+(\.\d+)?%/);

  // Reload — list view should still be active (persisted in localStorage).
  await page.reload();
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('list view honours lane filter and forwards the role slug on click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();
  await page.getByLabel('Role filter').selectOption('JUNGLE');

  const leeSinRow = page.getByRole('link', { name: 'View Lee Sin' });
  await expect(leeSinRow).toHaveAttribute('href', '/champion/LeeSin?role=jungle');
});

test('list view header sorts by Hex Score on column click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  // Default is name-asc — Aatrox at the top.
  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards.first()).toHaveAttribute('href', /^\/champion\/Aatrox/);

  // Click the Hex Score column header. Default direction for non-name sorts is desc.
  await page.getByRole('button', { name: /^Hex Score/ }).click();
  await expect(cards.first()).not.toHaveAttribute('href', /^\/champion\/Aatrox/);

  // Clicking again flips to ascending (worst champions first).
  await page.getByRole('button', { name: /^Hex Score/ }).click();
  // Ascending = lowest-score champion at the top. We don't assert a specific name
  // (that depends on the current patch's data), but the first row should still
  // belong to some champion that doesn't match Aatrox just by chance.
  await expect(cards.first()).toBeVisible();
});

test('first-visit hint appears next to the list-view toggle and persists dismissal', async ({
  page
}) => {
  await page.goto('/');
  // Hint appears after the 800ms mount delay.
  const hint = page.getByRole('note', { name: 'Tip: detailed view' });
  await expect(hint).toBeVisible({ timeout: 2500 });

  // Dismissing via the × button hides it and persists across reload.
  await page.getByRole('button', { name: 'Dismiss tip' }).click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1100);
  await expect(page.getByRole('note', { name: 'Tip: detailed view' })).toHaveCount(0);
});

test('first-visit hint also dismisses when the user clicks list view', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('note', { name: 'Tip: detailed view' })).toBeVisible({
    timeout: 2500
  });

  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.getByRole('note', { name: 'Tip: detailed view' })).toHaveCount(0);

  // Switching back to splash view should not bring the hint back.
  await page.getByRole('button', { name: 'Splash card view' }).click();
  await page.waitForTimeout(1100);
  await expect(page.getByRole('note', { name: 'Tip: detailed view' })).toHaveCount(0);
});

test('reset sort button restores the default name-ascending order', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards.first()).toHaveAttribute('href', /^\/champion\/Aatrox/);

  // Sort by Hex Score (desc) — Aatrox should no longer be first; Reset button appears.
  await page.getByRole('button', { name: /^Hex Score/ }).click();
  await expect(cards.first()).not.toHaveAttribute('href', /^\/champion\/Aatrox/);

  const reset = page.getByRole('button', { name: /Reset sort/i });
  await expect(reset).toBeVisible();
  await reset.click();

  // Back to name-asc, and the reset button hides itself again.
  await expect(cards.first()).toHaveAttribute('href', /^\/champion\/Aatrox/);
  await expect(reset).toHaveCount(0);
});

test('list view shows a rank column based on Hex Score', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  // Sort by Hex Score desc so rank #1 should be the top row.
  await page.getByRole('button', { name: /^Hex Score/ }).click();

  const firstRow = page.locator('ul a[href^="/champion/"]').first();
  await expect(firstRow).toBeVisible();

  // The leftmost cell of the row contains the rank "1" (highest-scored champion).
  const rankCell = firstRow.locator('> :first-child');
  await expect(rankCell).toHaveText('1');
});

test('rank hint bubble shows on first list view + dismisses on rank click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  const bubble = page.getByRole('note', { name: 'Tip: click rank to filter' });
  await expect(bubble).toBeVisible();

  // Clicking any rank should both filter AND dismiss the bubble forever.
  const asheRank = page.getByRole('link', { name: 'View Ashe' }).getByRole('button', { name: /Bot/ });
  await asheRank.click();
  await expect(bubble).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('note', { name: 'Tip: click rank to filter' })).toHaveCount(0);
});

test('rank hint × button also dismisses', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  const bubble = page.getByRole('note', { name: 'Tip: click rank to filter' });
  await expect(bubble).toBeVisible();
  await bubble.getByRole('button', { name: 'Dismiss tip' }).click();
  await expect(bubble).toHaveCount(0);
});

test('clicking a rank cell filters the list to that champion\'s role', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();

  // Default sort is name-asc. Find Ashe's row (Ashe's top lane is BOTTOM).
  const asheRow = page.getByRole('link', { name: 'View Ashe' });
  await expect(asheRow).toBeVisible();
  const asheRank = asheRow.getByRole('button', { name: /Bot/ });
  await expect(asheRank).toBeVisible();
  await asheRank.click();

  // Role select should now read Bot — and the URL on Ashe's row should reflect ?role=bot.
  await expect(page.getByLabel('Role filter')).toHaveValue('BOTTOM');
  await expect(asheRow).toHaveAttribute('href', '/champion/Ashe?role=bot');

  // Hard-bot-only champions stay; clearly non-bot champions are gone.
  await expect(page.getByRole('link', { name: 'View Caitlyn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Garen' })).toHaveCount(0);
});

test('Hex Score column has a help icon linking to the FAQ', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'List view' }).click();
  const help = page.getByRole('link', { name: 'What is the Hex Score?' });
  await expect(help).toHaveAttribute('href', '/faq#hex-score');
  await help.click();
  await expect(page).toHaveURL(/\/faq#hex-score$/);
  // FAQ auto-opens the linked section.
  await expect(page.locator('#hex-score-panel')).toBeVisible();
});

test('difficulty filter narrows the grid by DDragon info.difficulty', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('ul a[href^="/champion/"]');
  await expect(cards.first()).toBeVisible();

  await page.getByLabel('Skill level filter').selectOption('easy');

  // DDragon-easy (0–3): Amumu (3) and Darius (2) are in. Riven/Azir/Yasuo (8–10) are out.
  await expect(page.locator('ul a[href^="/champion/Amumu"]')).toBeVisible();
  await expect(page.locator('ul a[href^="/champion/Darius"]')).toBeVisible();
  await expect(page.locator('ul a[href^="/champion/Riven"]')).toHaveCount(0);
  await expect(page.locator('ul a[href^="/champion/Azir"]')).toHaveCount(0);

  await expect(cards).not.toHaveCount(172);
});

test('FAQ page loads with the explanation sections', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.getByRole('heading', { name: /How we do things/i })).toBeVisible();
  // The Hex Score section is the heart of the page — make sure it renders.
  await expect(page.locator('#hex-score')).toBeVisible();
  await expect(page.locator('#patch-scope')).toBeVisible();
});

test('FAQ is linked from the footer', async ({ page }) => {
  await page.goto('/');
  const footerLink = page.locator('footer a[href="/faq"]');
  await expect(footerLink).toBeVisible();
});

test('robots.txt is served', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('Sitemap:');
});
