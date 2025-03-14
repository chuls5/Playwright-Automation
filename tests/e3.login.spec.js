const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const dotenv = require('dotenv');

// Load enviorment variables
dotenv.config();

// Get configuration from environment variables
const validUsername2 = process.env.VALID_USERNAME2 || ''; 
const validPassword2 = process.env.VALID_PASSWORD2 || ''; 

test('launch e3 desktop application', async () => {
  const electronApp = await electron.launch({
    executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    args: []
  });

  const window = await electronApp.firstWindow();

  // Wait for 8 seconds for the app to load
  await new Promise(resolve => setTimeout(resolve, 7000));

  // Wait for the welcome label to appear
  const welcomeLabel = window.locator('label.login-welcome.e3-lang-login-welcome');
  await expect(welcomeLabel).toBeVisible(); // Assert that the welcome label is visible

  // Exit app.
  await electronApp.close();
});

test('launch e3 desktop application, login, logout', async () => {
  const electronApp = await electron.launch({
    executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    args: []
  });

  const window = await electronApp.firstWindow();

  // Wait for 8 seconds for the app to load
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Fill in the username
  await window.fill('input#username', validUsername2); // Replace 'chuls' with the actual username

  // Fill in the password
  await window.fill('input#passwordInput', validPassword2); // Replace with the actual password

  // Click the Sign-in button using its ID
  await window.click('#button-login'); // Use the ID selector for the button

  // Assert that the element indicating successful login is visible
  const whatToDoQuestion = window.locator('.no-wrap.headline-text.e3-lang-page-what-to-do-question');
  await expect(whatToDoQuestion).toBeVisible(); // Assert that the question element is visible

  // Click on the account button
  await window.click('#button-account'); // Click the account button

  // Click on the logout button
  await window.click('#button-logout'); // Click the logout button

  // Wait for 3 seconds for the app to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Wait for the welcome label to appear
  const welcomeLabel = window.locator('label.login-welcome.e3-lang-login-welcome');
  await expect(welcomeLabel).toBeVisible(); // Assert that the welcome label is visible

  // Exit app.
  await electronApp.close();
});