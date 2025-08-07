import puppeteer from 'puppeteer';

async function checkDeployment() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Track page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('Checking dashboard page...');
    await page.goto('https://labsystem-a1.web.app/dashboard', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    console.log('Dashboard - Console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Dashboard errors:', consoleErrors);
    }
    
    // Clear errors for next page
    consoleErrors.length = 0;
    pageErrors.length = 0;
    
    console.log('\nChecking test orders page...');
    await page.goto('https://labsystem-a1.web.app/tests/orders?action=new', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    // Check for "Something went wrong" error
    const errorText = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('Something went wrong') ? 'Found error text' : 'No error text found';
    });
    
    console.log('Test Orders - Error check:', errorText);
    console.log('Test Orders - Console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Test Orders errors:', consoleErrors);
    }
    
    // Check a few more pages
    const pagesToCheck = [
      '/patients',
      '/samples',
      '/results',
      '/billing'
    ];
    
    for (const pagePath of pagesToCheck) {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      
      console.log(`\nChecking ${pagePath} page...`);
      await page.goto(`https://labsystem-a1.web.app${pagePath}`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);
      
      console.log(`${pagePath} - Console errors:`, consoleErrors.length);
      if (consoleErrors.length > 0) {
        console.log(`${pagePath} errors:`, consoleErrors);
      }
    }
    
  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await browser.close();
  }
}

checkDeployment().catch(console.error);