const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

test('TC_111709 - E3 login screen matches Figma flow', async () => {
  // Step 1: Launch the eNcounter3 application
  const electronApp = await electron.launch({
    executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    args: [],
  });

  const window = await electronApp.firstWindow();

  // Wait for app to fully load
  await new Promise(resolve => setTimeout(resolve, 7000));

  // Step 2: Verify the login screen components
  const welcomeLabel = window.locator('label.login-welcome.e3-lang-login-welcome');
  await expect(welcomeLabel).toBeVisible();

  // Ensure the screenshots directory exists
  const screenshotsDir = path.join(__dirname, 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  // Take a screenshot of the login window
  const defaultScreenshotPath = path.join(screenshotsDir, 'login-screen-default.png');
  const defaultScreenshotBuffer = await window.screenshot({ path: defaultScreenshotPath });

  // Resize the screenshot to 500x700 - this is the only new file generated
  const resizedDefaultScreenshotPath = path.join(screenshotsDir, 'login-screen-default-resized.png');
  await sharp(defaultScreenshotBuffer)
    .resize(500, 700, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFile(resizedDefaultScreenshotPath);

  // Compare with expected design
  await expect(defaultScreenshotBuffer).toMatchSnapshot('expected-login-screen-electron-win32.png', {
    threshold: 0.1,
  });

  // Step 3: Verify UI elements and styling
  const usernameInput = window.locator('input#username');
  await expect(usernameInput).toBeVisible();
  
  const usernameColor = await usernameInput.evaluate((el) => getComputedStyle(el).color);
  expect(usernameColor).toBe('rgb(0, 0, 0)');

  const welcomeFont = await welcomeLabel.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(welcomeFont).toContain('Roboto');

  // Step 4: Verify form elements
  const passwordInput = window.locator('input#passwordInput');
  const loginButton = window.locator('#button-login');
  
  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(loginButton).toBeVisible();

  // Verify placeholder text
  expect(await usernameInput.getAttribute('placeholder')).toBe('Enter username');
  expect(await passwordInput.getAttribute('placeholder')).toBe('Enter Password');
  expect(await loginButton.textContent()).toBe('Sign-in');

  // Close the application
  await electronApp.close();
});