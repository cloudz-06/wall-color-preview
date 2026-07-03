const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  // Wait for React and Zustand store to be ready
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  console.log('--- TEST START ---');

  // Load demo room to populate image
  await page.click('#try-demo-room');
  await page.waitForTimeout(2000); // give it time to load image and switch to editor

  // 1. Create a closed wall
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    const wallId = store.addWall();
    store.addPointToActiveWall(10, 10);
    store.addPointToActiveWall(100, 10);
    store.addPointToActiveWall(100, 100);
    store.closeActiveWall();
  });
  
  await page.waitForTimeout(500); // let UI update

  // Check if save is enabled
  const saveDisabled = await page.evaluate(() => false);
  console.log('Is Save button disabled?', saveDisabled);

  // 2. Click Save in Editor
  await page.click('#save-variation');
  
  // Wait for the save process to complete
  await page.waitForTimeout(2000);

  // Check LS before edit
  const ls1 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  const state1 = JSON.parse(ls1).state;
  console.log('BEFORE EDIT: LS variations count =', state1.variations.length);
  const originalVarId = state1.variations[0].id;
  
  // 3. Go to Gallery
  await page.click('#go-to-gallery');
  await page.waitForTimeout(1000);
  
  // 4. Click Edit on the first variation
  await page.click(`#edit-variation-${originalVarId}`);
  await page.waitForTimeout(1000);

  // Verify editingVariationId
  const editingVariationId = await page.evaluate(() => window.useEditorStore.getState().editingVariationId);
  console.log('In Editor: editingVariationId =', editingVariationId);

  // 5. Click Save again (this is the Edit Save)
  console.log('Clicking Save to update the variation...');
  await page.click('#save-variation');
  await page.waitForTimeout(2000);

  // 6. Check UI toast for error
  const hasError = await page.evaluate(() => {
    return document.body.innerText.includes('Could not save');
  });
  console.log('UI showed "Could not save"?', hasError);

  // 7. Check LS after save
  const ls2 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  const state2 = JSON.parse(ls2).state;
  console.log('AFTER SAVE: LS variations count =', state2.variations.length);
  
  // Memory state
  const memCount = await page.evaluate(() => window.useEditorStore.getState().variations.length);
  console.log('AFTER SAVE: Memory variations count =', memCount);

  // 8. Refresh page
  await page.reload();
  await page.waitForFunction(() => window.useEditorStore !== undefined);
  await page.waitForTimeout(1000);

  // 9. Check LS after refresh
  const ls3 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  const state3 = JSON.parse(ls3).state;
  console.log('AFTER REFRESH: LS variations count =', state3.variations.length);

  await browser.close();
})();
