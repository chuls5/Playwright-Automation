const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const dotenv = require('dotenv');

dotenv.config();

const adminUsername = process.env.ADMIN_USERNAME || 'wrong';
const adminPassword = process.env.ADMIN_PASSWORD || 'wrong';

test('TC_96395 - Administrator Log In', async () => {
  let electronApp;

  try {
    // Launch the eNcounter3 application
    electronApp = await electron.launch({
      executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    });

    const mainWindow = await electronApp.firstWindow();

    // Wait for the welcome label to be visible
    const welcomeLabel = mainWindow.locator('label.login-welcome.e3-lang-login-welcome');
    await expect(welcomeLabel).toBeVisible();

    // Wait for the application to load completely before filling in the login form
    await mainWindow.waitForLoadState('load'); // Wait for the page to fully load

    // Fill in the login form with Admin credentials
    await mainWindow.fill('input#username', adminUsername);
    await mainWindow.fill('input#passwordInput', adminPassword);
    await mainWindow.click('#button-login');

    // Wait for the DICOM Settings title to be visible
    const dicomTitle = mainWindow.locator('.e3-lang-cfg-dicom-title');
    await expect(dicomTitle).toBeVisible({ timeout: 10000 }); // Increase timeout to 10 seconds

    // Assert that the text content is "DICOM Settings"
    await expect(dicomTitle).toHaveText('DICOM Settings');

  } catch (error) {
    console.error('Test failed due to an error:', error);
    throw error; // Re-throw error for proper test failure
  } finally {
    // Ensure the application is closed after the test
    if (electronApp) {
      await electronApp.close();
    }
  }
});