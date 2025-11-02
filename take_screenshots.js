const playwright = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'awilddandy9@gmail.com');
    await page.fill('input[type="password"]', 'Supremo_123456789');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Import page
    console.log('Navigating to Import page...');
    await page.goto('http://localhost:3000/import');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of empty import page
    console.log('Taking screenshot: Quick Import page (empty)...');
    await page.screenshot({ 
      path: 'public/screenshots/pc/quick-import.png',
      fullPage: false
    });
    await page.screenshot({ 
      path: 'public/screenshots/mac/quick-import.png',
      fullPage: false
    });
    console.log('✓ Saved quick-import.png');

    // Add sample text to demonstrate the interface
    const sampleText = `G:\\Google Drive\\Scientology\\auditor-courses\\1967-dianetic-auditing-course.pdf
G:\\Google Drive\\Scientology\\clearing-courses\\clear-certainty-rundown.pdf
G:\\Google Drive\\Scientology\\training\\academy-level-0.pdf
G:\\Google Drive\\Scientology\\tech-volumes\\technical-bulletins-vol-1.pdf`;

    console.log('Filling in sample paths...');
    const textarea = await page.locator('textarea').first();
    await textarea.fill(sampleText);
    await page.waitForTimeout(500);

    // Take screenshot with text
    console.log('Taking screenshot: Quick Import with sample paths...');
    await page.screenshot({ 
      path: 'public/screenshots/pc/quick-import-filled.png',
      fullPage: false
    });
    await page.screenshot({ 
      path: 'public/screenshots/mac/quick-import-filled.png',
      fullPage: false
    });
    console.log('✓ Saved quick-import-filled.png');

    // Click Auto Detect
    console.log('Clicking Auto Detect...');
    const autoDetectButton = await page.getByText('Auto Detect', { exact: false });
    await autoDetectButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot after auto detect
    console.log('Taking screenshot: After Auto Detect...');
    await page.screenshot({ 
      path: 'public/screenshots/pc/after-auto-detect.png',
      fullPage: false
    });
    console.log('✓ Saved after-auto-detect.png');

    // Click Generate CSV
    console.log('Looking for Generate CSV button...');
    await page.waitForTimeout(1000);
    const generateButton = await page.getByText('Generate CSV', { exact: false });
    await generateButton.click();
    await page.waitForTimeout(1500);

    // Take screenshot of the CSV modal/popup
    console.log('Taking screenshot: Import CSV popup...');
    await page.screenshot({ 
      path: 'public/screenshots/pc/import-csv.png',
      fullPage: false
    });
    await page.screenshot({ 
      path: 'public/screenshots/mac/import-csv.png',
      fullPage: false
    });
    console.log('✓ Saved import-csv.png');

    console.log('\n✅ All screenshots taken successfully!');
    console.log('\nScreenshots saved:');
    console.log('- quick-import.png (empty page)');
    console.log('- quick-import-filled.png (with sample paths)');
    console.log('- after-auto-detect.png (after analysis)');
    console.log('- import-csv.png (CSV generation popup)');

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
})();
