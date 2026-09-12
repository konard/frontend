import { test, expect } from '@playwright/test';

test.describe('Routing smoke suite', () => {
	test('visualizations hub is accessible', async ({ page }) => {
		await page.goto('/visualizations');

		await expect(page.getByRole('heading', { name: /explore ontology visualizations/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /network explorer/i })).toBeVisible();
	});

	test('network explorer visualization renders', async ({ page }) => {
		await page.goto('/visualizations/network-explorer');

		await expect(page.getByRole('heading', { name: /network explorer/i })).toBeVisible();
		await expect(page.locator('.network-container')).toBeVisible();
	});

	test('legacy visualization route redirects to new hub', async ({ page }) => {
		await page.goto('/visualization/flow');

		await expect(page).toHaveURL(/\/visualizations\/concept-flow/);
		await expect(page.getByRole('heading', { name: /concept flow/i })).toBeVisible();
	});

	test('login page is reachable', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
	});
});
