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

  // Step 1: Upload a room
  console.log('1. Upload a room');
  await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    s.setImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  });
  await page.goto('http://localhost:5173/editor');
  await page.waitForTimeout(1000);

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
  await page.waitForTimeout(500);

  // 3. Save
  console.log('3. Save');
  await page.click('#save-variation');
  await page.waitForTimeout(1000);

  // Fill localstorage to guarantee QuotaExceededError
  await page.evaluate(() => {
    const hugeStr = 'a'.repeat(4.8 * 1024 * 1024); // 4.8MB string
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
    const newWalls = [...s.walls];
    if(newWalls[0]) newWalls[0].color = '#ff00ff';
    window.useEditorStore.setState({ walls: newWalls });
  });
  await page.waitForTimeout(500);

  // 7. Click Save
  console.log('7. Click Save');
  await page.click('#save-variation');
  await page.waitForTimeout(2000);

  console.log('--- FINAL STATE ---');
  const finalState = await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    return {
      inMemoryCount: s.variations.length,
      lsData: localStorage.getItem('wall-paint-store') ? JSON.parse(localStorage.getItem('wall-paint-store')).state.variations.length : 'EMPTY'
    }
  });
  console.log('Final State:', finalState);

  await browser.close();
})();
