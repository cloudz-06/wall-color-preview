const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  await page.click('#try-demo-room');
  await page.waitForSelector('#save-variation');

  // Draw wall and save 4 times (which would definitely fail if full-size snapshot was used)
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      const s = window.useEditorStore.getState();
      s.addWall();
      s.addPointToActiveWall(10, 10);
      s.addPointToActiveWall(100, 10);
      s.addPointToActiveWall(100, 100);
      s.closeActiveWall();
    });
    
    await page.click('#save-variation');
    await page.waitForTimeout(1000); // Wait for generation and state save
  }

  // Go to gallery and check length
  await page.goto('http://localhost:5173/gallery');
  await page.waitForTimeout(500);

  const length = await page.evaluate(() => window.useEditorStore.getState().variations.length);
  const rawSize = await page.evaluate(() => localStorage.getItem('wall-paint-store')?.length);
  
  console.log('--- TEST RESULTS ---');
  console.log(`Saved variations: ${length} (Expected: 4)`);
  console.log(`localStorage total size: ${rawSize} bytes`);
  
  if (length === 4) {
    console.log('SUCCESS: All 4 variations saved successfully without QuotaExceededError!');
  } else {
    console.log('FAILURE: Expected 4 variations but got ' + length);
  }

  await browser.close();
})();
