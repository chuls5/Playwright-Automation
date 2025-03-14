const { test, expect, chromium } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const baseUrl = process.env.BASE_URL || 'http://your-application-url.com';
const validUsername = process.env.VALID_USERNAME || '';
const validPassword = process.env.VALID_PASSWORD || '';
const validUsername2 = process.env.VALID_USERNAME2 || '';
const validPassword2 = process.env.VALID_PASSWORD2 || '';

// Create a custom test fixture that handles setup and teardown
const communicationTest = test.extend({
  setup: async ({}, use) => {
    // Object to store all our resources
    const resources = {
      wss: null,
      electronApp: null,
      electronWindow: null,
      browser: null,
      context: null,
      page: null,
      lastMessageFromBrowser: null,
      videoContainersVerified: false,
      webSocketExchangeVerified: false
    };

    // === Step 1: Start WebSocket server ===
    resources.wss = new WebSocket.Server({ port: 8080 });
    
    resources.wss.on('connection', (ws) => {
      console.log('Electron WebSocket server: client connected.');

      ws.on('message', (message) => {
        const messageStr = message.toString();
        console.log(`Electron WebSocket server received: ${messageStr}`);

        resources.lastMessageFromBrowser = messageStr;

        // Send reply to the browser client
        ws.send('Hello from Electron WebSocket server');
      });

      // Store websocket connection for later use
      resources.serverWs = ws;
    });

    console.log('WebSocket server started on ws://localhost:8080');

    // === Step 2: Launch and login to the Electron app ===
    resources.electronApp = await electron.launch({
      executablePath: 'C:\\Program Files (x86)\\GLOBALMEDIA GROUP LLC\\eNcounter3_electron\\encounter.exe',
      args: []
    });

    resources.electronWindow = await resources.electronApp.firstWindow();

    // Wait for the app to load (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 11000));

    console.log('Logging into Electron app...');

    // Fill in credentials
    await resources.electronWindow.fill('input#username', validUsername2);
    await resources.electronWindow.fill('input#passwordInput', validPassword2);
    await resources.electronWindow.click('#button-login');

    // Wait for post-login loading (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verify login success
    const whatToDoQuestion = resources.electronWindow.locator('.no-wrap.headline-text.e3-lang-page-what-to-do-question');
    await expect(whatToDoQuestion).toBeVisible();

    console.log('Electron app login successful.');
    
    // === Step 3: Launch browser page (Chromium only) ===
    resources.browser = await chromium.launch();
    resources.context = await resources.browser.newContext();
    resources.page = await resources.context.newPage();

    // Navigate to the web app
    await resources.page.goto('https://encounter.qa-encounterservices.com/eview/eview.html');
    console.log('Browser page loaded.');

    // === Step 4: Login to the web browser app ===
    console.log('Logging into web browser app...');

    // Fill in valid login credentials
    await resources.page.getByRole('textbox', { name: 'Username' }).fill(validUsername);
    await resources.page.getByRole('textbox', { name: 'Password' }).fill(validPassword);
    await resources.page.getByRole('button', { name: 'Sign in' }).click();

    // === Step 5: Grant permissions (Chromium only) ===
    await resources.context.grantPermissions(['microphone', 'camera']);
    console.log('Granted microphone and camera permissions in Chromium.');

    // === Step 6: Handle post-login dialogs ===
    await resources.page.getByRole('button', { name: 'OK' }).click();
    console.log('Clicked OK button after login.');

    // === Step 7: Connect to WebSocket server from browser ===
    console.log('Browser connecting to WebSocket server...');

    await resources.page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.addEventListener('open', () => {
          console.log('Browser WebSocket client connected.');
          ws.send('Hello from browser client');
        });

        ws.addEventListener('message', (event) => {
          console.log('Browser received message:', event.data);
          window.lastMessageFromServer = event.data;
          resolve();
        });

        ws.addEventListener('error', (error) => {
          console.error('Browser WebSocket error:', error);
          reject(error);
        });

        window.ws = ws; // Store for later use
      });
    });

    // Verify WebSocket message exchange
    const lastMessageFromServer = await resources.page.evaluate(() => window.lastMessageFromServer);
    console.log('Browser received WebSocket message:', lastMessageFromServer);

    expect(lastMessageFromServer).toBe('Hello from Electron WebSocket server');
    expect(resources.lastMessageFromBrowser).toBe('Hello from browser client');
    
    console.log('WebSocket message exchange verified.');
    resources.webSocketExchangeVerified = true;
    
    // === Step 8: Initiate call from web browser to desktop app ===
    console.log('Initiating call from web browser to desktop app...');
    
    try {
      await resources.page.locator('#liUser_25307').click();
      await resources.page.locator('#call-button div').click();
      console.log('Call initiated from web browser.');
    } catch (error) {
      console.error('Error initiating call from web browser:', error);
      throw error;
    }
    
    // === Step 9: Accept call on desktop app ===
    console.log('Accepting call on desktop app...');
    
    try {
      const acceptButton = resources.electronWindow.locator('.modal-action.modal-close.waves-effect.waves-green.btn.green.accent-4.e3-lang-accept#incoming-call-accept');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      console.log('Call accepted on desktop app.');
      
      // === Step 10: Click OK button after accepting call ===
      console.log('Clicking OK button after accepting call...');
      const okButton = resources.electronWindow.locator('.btn-ok.btn-flat.e3-lang-button-ok');
      await expect(okButton).toBeVisible({ timeout: 5000 });
      await okButton.click();
      console.log('OK button clicked after accepting call.');
      
      // Wait for the popup to disappear (7 seconds)
      console.log('Waiting for popup to disappear (7 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 7000));
      
      // === Step 11: Verify both video displays ===
      console.log('Verifying video displays on desktop app...');
      
      // Check that the first video container is visible
      const videoContainer1 = resources.electronWindow.locator('.box-video.blue-grey.darken-3.z-depth-2').first();
      await expect(videoContainer1).toBeVisible({ timeout: 10000 });
      console.log('First video container verified on desktop app.');
      
      // Check that the second video container is also visible
      const videoContainer2 = resources.electronWindow.locator('.box-video.blue-grey.darken-3.z-depth-2').nth(1);
      await expect(videoContainer2).toBeVisible({ timeout: 10000 });
      console.log('Second video container verified on desktop app.');
      
      console.log('Both video displays verified on desktop app.');
      resources.videoContainersVerified = true;
      
      // === Step 12: Wait for video data to load ===
      console.log('Waiting for video data to load (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Video call test completed.');
      
    } catch (error) {
      console.error('Error in desktop app call flow:', error);
      throw error;
    }

    // Allow the fixture to be used by the test
    await use(resources);

    // Cleanup after all tests are done
    console.log('Cleaning up resources...');
    
    // === Step 13: End call from desktop app ===
    try {
      console.log('Ending call from desktop app...');
      
      // Try different selectors for the end call button
      const possibleEndCallSelectors = [
        '#end-call-button',
        '.end-call-button',
        '.call-end-button',
        '.call-controls .end-call',
        '.hang-up-button',
        '.hangup-button',
        '.call-end-btn',
        'button[aria-label="End Call"]'
      ];
      
      let endCallButton = null;
      
      for (const selector of possibleEndCallSelectors) {
        const button = resources.electronWindow.locator(selector);
        if (await button.count() > 0 && await button.isVisible()) {
          endCallButton = button;
          console.log(`Found end call button with selector: ${selector}`);
          break;
        }
      }
      
      if (endCallButton) {
        await endCallButton.click();
        console.log('Ended call from desktop app.');
      } else {
        console.log('Could not find end call button on desktop app, trying alternative approach.');
        
        // Try to press Escape key to end call
        await resources.electronWindow.keyboard.press('Escape');
        console.log('Pressed Escape key to try ending call.');
      }
      
      // Wait for call to disconnect
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error ending call from desktop app:', error);
    }
    
    // Fallback to ending call from web browser if needed
    try {
      console.log('Attempting to end call from web browser...');
      const endCallButton = resources.page.locator('#end-call-button');
      if (await endCallButton.count() > 0 && await endCallButton.isVisible()) {
        await endCallButton.click();
        console.log('Ended call from web browser.');
      }
    } catch (webError) {
      console.error('Error ending call from web browser:', webError);
    }
    
    // === Step 14: Logout from the Electron app ===
    try {
      console.log('Logging out from Electron app...');
      await resources.electronWindow.click('#button-account');
      await resources.electronWindow.click('#button-logout');

      const welcomeLabel = resources.electronWindow.locator('label.login-welcome.e3-lang-login-welcome');
      await expect(welcomeLabel).toBeVisible();
      console.log('Electron app logout successful.');
    } catch (error) {
      console.error('Error during Electron app logout:', error);
    }
    
    // === Step 15: Logout from the web app ===
    try {
      console.log('Logging out from web app...');
      await resources.page.getByTitle('Logout').locator('span').click();
      console.log('Logged out from the web app.');

      await expect(resources.page.locator('.Login-background')).toBeVisible();
      console.log('Returned to login screen in web app.');
    } catch (error) {
      console.error('Error during web app logout:', error);
    }

    // Close browser and Electron app
    if (resources.browser) await resources.browser.close();
    if (resources.electronApp) await resources.electronApp.close();
    
    // Close WebSocket server
    if (resources.wss) resources.wss.close();

    console.log('Cleaned up all resources.');
  }
});

// Single test that combines all the verifications
communicationTest('Test video call and WebSocket communication', async ({ setup }) => {
  // Check that our verifications were successful
  expect(setup.webSocketExchangeVerified).toBe(true);
  expect(setup.videoContainersVerified).toBe(true);
  
  console.log('All verifications passed successfully.');
});