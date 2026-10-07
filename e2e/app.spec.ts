import { expect, test, type Page } from '@playwright/test';

async function skipOnboarding(page: Page) {
  await page.context().addInitScript(() => {
    localStorage.setItem('forest:WALKTHROUGH_FINISHED', 'true');
    localStorage.setItem('forest:ONBOARDING_TOOLTIP_FIRST_TIME_FINISHED', 'true');
    localStorage.setItem('forest:PREVIOUS_PLANT_TIME_MIN', '5');
    localStorage.setItem('forest:COIN_BALANCE', '1000');
  });
}

test.describe('onboarding', () => {
  test('first visit walks through landing and the 6-page walkthrough', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Plant your Grove,')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Start Journey' }).click();
    const heading = page.getByRole('heading', { name: /Welcome To Forest/ });
    await expect(heading).toBeVisible();

    // Page 1 advances by dragging the seedling down.
    const box = await heading.boundingBox();
    const startX = box ? box.x + box.width / 2 : 195;
    const startY = box ? box.y + 20 : 200;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 320, { steps: 8 });
    await page.mouse.up();

    for (const label of ['Continue', "I'll focus", 'Keep focusing', 'Grow Change']) {
      await page.getByRole('button', { name: label }).click();
    }
    await page.getByRole('button', { name: 'Start Now' }).click();
    await expect(page.getByTestId('plant-button')).toBeVisible();
  });
});

test.describe('core planting loop', () => {
  test('plant → growing → success result (fast mode)', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/main');
    await page.getByTestId('plant-button').click();
    await expect(page.getByRole('button', { name: 'Give Up' })).toBeVisible();
    await expect(page.getByText(/Hooray/)).toBeVisible({ timeout: 25_000 });
  });

  test('give up → failure result', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/main');
    await page.getByTestId('plant-button').click();
    await page.getByRole('button', { name: 'Give Up' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Give Up' }).click();
    await expect(page.getByText(/died because of/)).toBeVisible({ timeout: 10_000 });
  });

  test('reload while growing restores the session', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/main');
    await page.getByTestId('plant-button').click();
    await expect(page.getByRole('button', { name: 'Give Up' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Give Up' })).toBeVisible();
    await expect(page.getByText(/Hooray/)).toBeVisible({ timeout: 25_000 });
  });

  test('navigating away while growing kills the tree', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/main');
    await page.getByTestId('plant-button').click();
    await expect(page.getByRole('button', { name: 'Give Up' })).toBeVisible();
    await page.goto('about:blank');
    await page.goto('/main');
    await expect(page.getByText(/died because of/)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('secondary screens', () => {
  test('creates a tag', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/tags');
    await page.getByRole('button', { name: 'New tag' }).click();
    await page.getByLabel('Tag name').fill('Study');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Study')).toBeVisible();
  });

  test('switches language to Vietnamese and persists', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: 'VI' }).click();
    await expect(page.getByText('Cài đặt')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Cài đặt')).toBeVisible();
  });
});
