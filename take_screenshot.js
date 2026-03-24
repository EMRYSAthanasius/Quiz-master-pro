const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8000');
  await page.waitForTimeout(2000); // Wait for things to render
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
