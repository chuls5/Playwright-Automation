const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const dotenv = require('dotenv');

dotenv.config();

const invalidUsername = process.env.INVALID_USERNAME || 'wrong';
const invalidPassword = process.env.INVALID_PASSWORD || 'wrong';

test('TC_93305 User inputs invalid login and gets "Invalid Username or Password" Message', async () => {
  const electronApp = await electron.launch({
    executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    args: [],
  });

  const window = await electronApp.firstWindow();

  try {
    // Check if the welcome label is visible
    const welcomeLabel = window.locator('label.login-welcome.e3-lang-login-welcome');
    await expect(welcomeLabel).toBeVisible();

    // Fill in the login form with invalid credentials
    await window.fill('input#username', invalidUsername);
    await window.fill('input#passwordInput', invalidPassword);
    await window.click('#button-login');

    // Locate the snackbar element
    const snackbar = window.locator('#snackbar');

    // Wait for the snackbar to be visible and verify the message
    await expect(snackbar).toBeVisible();
    await expect(snackbar).toHaveText(/Invalid Username or Password/);
  } catch (error) {
    console.error('Test failed due to an error:', error);
    throw error; // Re-throw error for proper test failure
  } finally {
    await electronApp.close();
  }
});