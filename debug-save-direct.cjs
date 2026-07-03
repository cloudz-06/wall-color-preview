const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  console.log('--- TEST START ---');

  // 1. Manually add a mock variation to the store to simulate Gallery
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    const variation = {
      id: 'mock-var-1',
      projectName: 'Test',
      snapshot: 'data:image/png;base64,mock',
      walls: [{ id: 'w1', points: [0,0, 10,10, 0,10], closed: true, color: '#ff0000' }],
      windows: [],
      imageWidth: 800,
      imageHeight: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    window.useEditorStore.setState({
      variations: [variation],
      image: 'data:image/png;base64,mockimage'
    });
  });

  // 2. Simulate Gallery Edit
  await page.evaluate(() => {
    window.useEditorStore.getState().loadVariation('mock-var-1');
  });

  // 3. Verify editingVariationId
  const editId1 = await page.evaluate(() => window.useEditorStore.getState().editingVariationId);
  console.log('After loadVariation, editingVariationId:', editId1);

  // 4. Simulate Save (which calls updateVariation)
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    if (store.editingVariationId) {
      store.updateVariation(store.editingVariationId, 'data:image/png;base64,newmock');
    } else {
      store.saveVariation('data:image/png;base64,newmock');
    }
  });

  // 5. Check variations count and editingVariationId
  const count1 = await page.evaluate(() => window.useEditorStore.getState().variations.length);
  const editId2 = await page.evaluate(() => window.useEditorStore.getState().editingVariationId);
  console.log('After first save, variations count:', count1);
  console.log('After first save, editingVariationId:', editId2);

  // 6. Simulate a SECOND Save (what the user might have done)
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    if (store.editingVariationId) {
      store.updateVariation(store.editingVariationId, 'data:image/png;base64,newmock2');
    } else {
      store.saveVariation('data:image/png;base64,newmock2');
    }
  });

  // 7. Check variations count
  const count2 = await page.evaluate(() => window.useEditorStore.getState().variations.length);
  console.log('After second save, variations count:', count2);

  await browser.close();
})();
