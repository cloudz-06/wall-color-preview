const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Forward console logs to terminal
  page.on('console', msg => {
    if (msg.text().includes('[SAVE_PIPELINE]') || msg.text().includes('Quota') || msg.text().includes('error')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  console.log('--- REPRODUCING BUG ---');

  // Step 1: Upload a room (use demo room to ensure valid image)
  console.log('1. Click Try Demo Room');
  await page.click('#try-demo-room');
  await page.waitForSelector('#save-variation', { state: 'visible' });

  // Step 2: Draw one wall
  console.log('2. Draw one wall');
  await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    s.addWall();
    s.addPointToActiveWall(10,10);
    s.addPointToActiveWall(100,10);
    s.addPointToActiveWall(100,100);
    s.addPointToActiveWall(10,100);
    s.closeActiveWall();
  });
  await page.waitForTimeout(500); // wait for UI to update

  // 3. Save
  console.log('3. Save');
  await page.click('#save-variation');
  await page.waitForTimeout(1000); // Wait for save to complete

  // Create a massive payload to force QuotaExceededError on next save to simulate filled gallery
  await page.evaluate(() => {
    const hugeStr = 'a'.repeat(4 * 1024 * 1024); // 4MB string
    const s = window.useEditorStore.getState();
    s.variations[0].snapshot = hugeStr; 
    localStorage.setItem('wall-paint-store', JSON.stringify({ state: { variations: s.variations } }));
  });

  // 4. Open Gallery
  console.log('4. Open Gallery');
  await page.click('#go-to-gallery');
  await page.waitForTimeout(1000);

  // 5. Click Edit
  console.log('5. Click Edit');
  const varId = await page.evaluate(() => window.useEditorStore.getState().variations[0].id);
  await page.click('#edit-variation-' + varId);
  await page.waitForTimeout(1000);

  // 6. Change the wall colour
  console.log('6. Change the wall colour');
  await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    s.updateWallColor(s.walls[0].id, '#ff00ff');
  });
  await page.waitForTimeout(500);

  // 7. Click Save
  console.log('7. Click Save');
  await page.click('#save-variation');
  await page.waitForTimeout(2000); // Wait for errors/toasts

  console.log('--- FINAL STATE ---');
  const finalState = await page.evaluate(() => {
    return {
      inMemoryCount: window.useEditorStore.getState().variations.length,
      lsData: localStorage.getItem('wall-paint-store') ? 'EXISTS' : 'EMPTY'
    }
  });
  console.log('Final State:', finalState);

  await browser.close();
})();
