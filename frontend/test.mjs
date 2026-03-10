import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="email"]', 'admin1@noor.com');
  await page.fill('input[type="password"]', 'NoorAbdullah');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Match Settings Tab
  const matchTab = await page.$('text="Match Settings"');
  if (matchTab) {
    await matchTab.click();
    console.log("Clicked match settings");
    await page.waitForTimeout(1000);

    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.includes("Scoring")) {
        console.log('Found Scoring button, clicking...');
        await btn.click();
        break;
      } else if (text && text.includes("Initialize")) {
        console.log('Found Initialize button, clicking...');
        await btn.click();
        break;
      }
    }
  } else {
    console.log("Could not find match settings, probably not logged in as admin");
  }

  await page.waitForTimeout(1000);
  console.log("Errors: ", errors);
  await browser.close();
})();
