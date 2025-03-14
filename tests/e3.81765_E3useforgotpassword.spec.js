const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test('TC_81765 - E3 User forgot password', async () => {
  let electronApp;

  try {
    // Launch the eNcounter3 application
    electronApp = await electron.launch({
      executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
    });

    const mainWindow = await electronApp.firstWindow();

    // Click on the Forgot Password button
    await mainWindow.click('#forgot-password');

    // Wait for the Password Reset window to open
    const passwordResetWindow = await electronApp.waitForEvent('window');

    // Verify the title of the Password Reset window
    const title = await passwordResetWindow.title();
    expect(title).toBe('Password Reset');

  } finally {
    if (electronApp) {
      await electronApp.close();
    }
  }
});
