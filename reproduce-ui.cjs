const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let pipelineLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('[SAVE_PIPELINE]')) {
      pipelineLogs.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  // 1. Upload room (bypass native dialog by injecting image via UI store)
  await page.evaluate(() => {
    window.useEditorStore.getState().setImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  });
  await page.goto('http://localhost:5173/editor');
  await page.waitForTimeout(500);

  // 2. Draw one wall (UI clicks)
  await page.evaluate(() => {
    window.useEditorStore.getState().addWall();
    window.useEditorStore.getState().addPointToActiveWall(10, 10);
    window.useEditorStore.getState().addPointToActiveWall(100, 10);
    window.useEditorStore.getState().addPointToActiveWall(100, 100);
    window.useEditorStore.getState().addPointToActiveWall(10, 100);
    window.useEditorStore.getState().closeActiveWall();
  });
  await page.waitForTimeout(500);

  // 3. Save
  await page.click('button[title="Save Project"]', { timeout: 1000 }).catch(() => page.click('#save-variation'));
  await page.waitForTimeout(500);

  // Fill storage to 4.9MB
  await page.evaluate(() => {
    const hugeStr = 'a'.repeat(4.9 * 1024 * 1024);
    const s = window.useEditorStore.getState();
    s.variations[0].snapshot = hugeStr; 
    localStorage.setItem('wall-paint-store', JSON.stringify({ state: { variations: s.variations } }));
  });

  // 4. Open Gallery
  await page.click('#go-to-gallery');
  await page.waitForTimeout(1000);

  // 5. Click Edit
  const varId = await page.evaluate(() => window.useEditorStore.getState().variations[0].id);
  await page.click(`#edit-variation-${varId}`);
  await page.waitForTimeout(1000);

  // 6. Change wall color
  await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    s.updateWall(s.walls[0].id, { color: '#00ff00' });
  });
  await page.waitForTimeout(500);

  // Clear previous logs
  pipelineLogs = [];

  // 7. Click Save
  await page.click('button[title="Save Project"]', { timeout: 1000 }).catch(() => page.click('#save-variation'));
  await page.waitForTimeout(1000);

  // Capture Final Data
  const finalState = await page.evaluate(() => {
    const s = window.useEditorStore.getState();
    let ls = null;
    try { ls = JSON.parse(localStorage.getItem('wall-paint-store')); } catch(e){}
    return {
      inMemoryCount: s.variations.length,
      lsCount: ls ? ls.state.variations.length : 0,
      editingVariationId: s.editingVariationId,
      lsJSON: ls
    }
  });

  const report = {
    logs: pipelineLogs,
    stateBeforeSave: "variations: 1, editingVariationId: " + varId,
    stateAfterSave: "variations: " + finalState.inMemoryCount + ", editingVariationId: " + finalState.editingVariationId,
    persistedJSON: finalState.lsJSON
  };

  fs.writeFileSync('report.json', JSON.stringify(report, null, 2));

  await browser.close();
})();
