import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get configuration from environment variables
const baseUrl = process.env.BASE_URL || 'http://your-application-url.com';
const validUsername = process.env.VALID_USERNAME || '';
const validPassword = process.env.VALID_PASSWORD || '';
const invalidUsername = process.env.INVALID_USERNAME || 'wrong';
const invalidPassword = process.env.INVALID_PASSWORD || 'wrong';

// Setup for all tests
test.beforeEach(async ({ page }) => {
  // Navigate to base URL before every test
  await page.goto(baseUrl);
});

// Individual tests
test('MainNavigation', async ({ page }) => {
  await expect(page).toHaveURL(baseUrl);
});

test('TC_001_InvalidUsername', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill(invalidUsername);
  await page.getByRole('textbox', { name: 'Password' }).fill(validPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid Username or Password')).toBeVisible();
});

test('TC_002_InvalidPassword', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill(validUsername);
  await page.getByRole('textbox', { name: 'Password' }).fill(invalidPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid username or Password')).toBeVisible();
});

test('TC_003_BothInvalidUsernameAndPassword', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill(invalidUsername);
  await page.getByRole('textbox', { name: 'Password' }).fill(invalidPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid username or Password')).toBeVisible();
});

test('TC_004_EmptyUsername', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill('');
  await page.getByRole('textbox', { name: 'Password' }).fill(validPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Enter a Username or Password')).toBeVisible();
});

test('TC_005_EmptyPassword', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill(validUsername);
  await page.getByRole('textbox', { name: 'Password' }).fill('');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Enter a Username or Password')).toBeVisible();
});

test('TC_006_BothEmptyUsernameAndPassword', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Username' }).fill('');
  await page.getByRole('textbox', { name: 'Password' }).fill('');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Enter a Username or Password')).toBeVisible();
});

test('TC_007_SuccessfulLogin', async ({ page, context }) => {
  // Fill in valid login credentials
  await page.getByRole('textbox', { name: 'Username' }).fill(validUsername);
  await page.getByRole('textbox', { name: 'Password' }).fill(validPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Get browser type
  const browserType = context.browser().browserType().name();

  // Grant permissions based on browser type
  try {
    if (browserType === 'chromium') {
      // Works fully in Chrome/Chromium
      await context.grantPermissions(['microphone', 'camera']);
    } else if (browserType === 'firefox') {
      // Firefox in Playwright doesn't support grantPermissions
      console.log('Note: Microphone and camera permissions cannot be auto-granted in Firefox via Playwright');
      // Optionally add manual workaround or skip permission step
    } else if (browserType === 'webkit') {
      // Webkit (Safari) has limited support
      console.log('Note: Webkit has limited permission granting support via Playwright');
      // Camera works in some cases, microphone might not
      await context.grantPermissions(['camera']); // Limited success
    }
  } catch (error) {
    console.log(`Permission grant failed for ${browserType}: ${error.message}`);
  }

  // Handle any post-login dialogs and logout
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByTitle('Logout').locator('span').click();

  // Confirm we've returned to the login screen
  await expect(page.locator('.Login-background')).toBeVisible();
});
