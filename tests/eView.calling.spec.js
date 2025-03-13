const { test, expect, BrowserContext } = require('@playwright/test');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get configuration from environment variables
const baseUrl = process.env.BASE_URL || 'http://your-application-url.com';
const validUsername = process.env.VALID_USERNAME || ''; // Nurse username (Mary404)
const validPassword = process.env.VALID_PASSWORD || ''; // Nurse password
const validUsername2 = process.env.VALID_USERNAME2 || ''; // Physician username (chuls)
const validPassword2 = process.env.VALID_PASSWORD2 || ''; // Physician password
const wsUrl = process.env.WS_URL || 'wss://encounter.qa-encounterservices.com:9119/';

// Helper function to log in a user
async function loginUser(page, username, password, userType) {
  console.log(`Logging in as ${userType}...`);
  await page.goto(baseUrl);
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  try {
    await page.getByRole('button', { name: 'OK' }).click({ timeout: 5000 });
  } catch (error) {
    console.log(`No dialog appeared for ${userType} or already closed`);
  }
  
  // Wait for the page to fully load and the "Logout" button to be visible
  await page.waitForLoadState('networkidle');
  await expect(page.getByTitle('Logout').locator('span')).toBeVisible({ timeout: 10000 });
  console.log(`${userType} successfully logged in`);
}

// Helper function to logout a user
async function logoutUser(page, userType) {
  console.log(`Logging out ${userType}...`);
  await page.getByTitle('Logout').locator('span').click({ timeout: 5000 });
  console.log(`${userType} successfully logged out`);
}

// Test Case 1: Verify users can see each other in contact lists
test('TC_001_VerifyContactListPresence', async ({ browser }) => {
  // Create separate browser contexts with permissions
  const nurseContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });
  const physicianContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });

  // Create pages for both users
  const nursePage = await nurseContext.newPage();
  const physicianPage = await physicianContext.newPage();

  try {
    // Setup WebSocket monitoring for both users
    let nurseWsConnected = false;
    nursePage.on('websocket', () => {
      nurseWsConnected = true;
      console.log('Nurse WebSocket connected');
    });

    let physicianWsConnected = false;
    physicianPage.on('websocket', () => {
      physicianWsConnected = true;
      console.log('Physician WebSocket connected');
    });

    // Step 1: Log in both users
    await loginUser(nursePage, validUsername, validPassword, 'nurse');
    await loginUser(physicianPage, validUsername2, validPassword2, 'physician');
    
    // Step 2: Verify WebSocket connections
    await expect.poll(() => nurseWsConnected, {
      message: 'Waiting for nurse WebSocket connection',
      timeout: 10000
    }).toBe(true);
    
    await expect.poll(() => physicianWsConnected, {
      message: 'Waiting for physician WebSocket connection',
      timeout: 10000
    }).toBe(true);
    
    // Step 3: Verify presence in contact lists using the specific locators
    console.log('Verifying contact list presence...');
    
    // Nurse should see physician online
    await expect(nursePage.getByText('chulsOnline')).toBeVisible({
      timeout: 15000
    });
    
    // Physician should see nurse online
    await expect(physicianPage.getByText('Mary404Online')).toBeVisible({
      timeout: 15000
    });
    
    console.log('Both users can see each other in their contact lists');
    
    // Step 4: Log out both users
    await logoutUser(nursePage, 'nurse');
    await logoutUser(physicianPage, 'physician');
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    // Clean up
    await nurseContext.close();
    await physicianContext.close();
  }
});

// Test Case 2: Complete call flow from nurse to physician
test('TC_002_NurseCallsPhysician', async ({ browser }) => {
  // Create separate browser contexts with permissions
  const nurseContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });
  const physicianContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });

  // Create pages for both users
  const nursePage = await nurseContext.newPage();
  const physicianPage = await physicianContext.newPage();

  try {
    // Step 1: Log in both users
    await loginUser(nursePage, validUsername, validPassword, 'nurse');
    await loginUser(physicianPage, validUsername2, validPassword2, 'physician');
    
    // Step 2: Wait for contact list to load (both users should see each other)
    await expect(nursePage.getByText('chulsOnline')).toBeVisible({
      timeout: 15000
    });
    
    await expect(physicianPage.getByText('Mary404Online')).toBeVisible({
      timeout: 15000
    });
    
    console.log('Contact lists loaded for both users');
    
    // Step 3: Nurse initiates call to physician
    console.log('Nurse initiating call to physician...');
    
    // Click on physician name in contact list
    await nursePage.locator('#liUser_25307').click();
    
    // Click the phone icon to start call
    await nursePage.locator('#call-button div').click();
    
    // Verify the calling status appears
    await expect(nursePage.getByText('Calling...chuls Decline')).toBeVisible({
      timeout: 10000
    });
    
    console.log('Call initiated by nurse');
    
    // Step 4: Physician receives call
    console.log('Physician receiving call...');
    
    // Verify incoming call notification
    await expect(physicianPage.getByText('Incoming CallMary404')).toBeVisible({
      timeout: 15000
    });
    
    // Physician answers the call
    await physicianPage.locator('#answer-call-button div').click();
    
    console.log('Call answered by physician');
    
    // Step 5: Verify call is connected for both parties
    console.log('Verifying call connection...');
    
    // Verify call is connected for physician (video element is visible)
    await expect(physicianPage.locator('#conference-main-video')).toBeVisible({
      timeout: 15000
    });
    
    // Allow some time for call to stabilize
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Call successfully connected');
    
    // Step 6: Physician ends the call
    console.log('Physician ending call...');
    await physicianPage.locator('#hang-up-button').getByTitle('Hang up your call').click();
    
    // Wait for call to disconnect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Call ended by physician');
    
    // Step 7: Log out both users
    await logoutUser(physicianPage, 'physician');
    await logoutUser(nursePage, 'nurse');
    
    console.log('Call test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    // Clean up
    await nurseContext.close();
    await physicianContext.close();
  }
});

// Test Case 3: Complete call flow from physician to nurse
test('TC_003_PhysicianCallsNurse', async ({ browser }) => {
  // Create separate browser contexts with permissions
  const nurseContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });
  const physicianContext = await browser.newContext({
    permissions: ['microphone', 'camera']
  });

  // Create pages for both users
  const nursePage = await nurseContext.newPage();
  const physicianPage = await physicianContext.newPage();

  try {
    // Step 1: Log in both users
    await loginUser(nursePage, validUsername, validPassword, 'nurse');
    await loginUser(physicianPage, validUsername2, validPassword2, 'physician');
    
    // Step 2: Wait for contact list to load (both users should see each other)
    await expect(nursePage.getByText('chulsOnline')).toBeVisible({
      timeout: 15000
    });
    
    await expect(physicianPage.getByText('Mary404Online')).toBeVisible({
      timeout: 15000
    });
    
    console.log('Contact lists loaded for both users');
    
    // Step 3: Physician initiates call to nurse
    console.log('Physician initiating call to nurse...');
    
    // Click on nurse name in contact list with the correct locator
    await physicianPage.locator('#liUser_25309').click();
    
    // Click the phone icon to start call
    await physicianPage.locator('#call-button div').click();
    
    // Verify the calling status appears
    await expect(physicianPage.getByText('Calling...Mary404 Decline')).toBeVisible({
      timeout: 10000
    });
    
    console.log('Call initiated by physician');
    
    // Step 4: Nurse receives call
    console.log('Nurse receiving call...');
    
    // Verify incoming call notification
    await expect(nursePage.getByText('Incoming Callchuls')).toBeVisible({
      timeout: 15000
    });
    
    // Nurse answers the call
    await nursePage.locator('#answer-call-button div').click();
    
    console.log('Call answered by nurse');
    
    // Step 5: Verify call is connected for both parties
    console.log('Verifying call connection...');
    
    // Verify call is connected for nurse (video element is visible)
    await expect(nursePage.locator('#conference-main-video')).toBeVisible({
      timeout: 15000
    });
    
    // Allow some time for call to stabilize
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Call successfully connected');
    
    // Step 6: Nurse ends the call
    console.log('Nurse ending call...');
    await nursePage.locator('#hang-up-button').getByTitle('Hang up your call').click();
    
    // Wait for call to disconnect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Call ended by nurse');
    
    // Step 7: Log out both users
    await logoutUser(physicianPage, 'physician');
    await logoutUser(nursePage, 'nurse');
    
    console.log('Call test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    // Clean up
    await nurseContext.close();
    await physicianContext.close();
  }
});