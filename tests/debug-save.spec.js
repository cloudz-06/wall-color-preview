import { test, expect } from '@playwright/test';

test('Debug gallery save workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  console.log('--- TEST START ---');

  // Step 1: Create an initial variation to simulate a saved project
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    store.setImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 100, 100, 'Test Project');
    
    // Add a closed wall
    const wallId = store.addWall();
    store.addPointToActiveWall(10, 10);
    store.addPointToActiveWall(20, 10);
    store.addPointToActiveWall(20, 20);
    store.closeActiveWall();
  });

  // Save the first variation
  await page.click('button:has-text("Save")');
  
  // Wait for toast to disappear
  await page.waitForTimeout(1000);

  // Go to gallery
  await page.click('button[title="Gallery"]');
  await page.waitForSelector('text=Your Variations');

  // Check initial state
  const ls1 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  console.log('BEFORE EDIT:', JSON.parse(ls1).state.variations.length, 'variations');

  // Step 2: Click Edit on the existing project
  await page.click('button:has-text("Edit")');
  await page.waitForSelector('text=Before / After');

  // Check editingVariationId
  const editingVariationId = await page.evaluate(() => window.useEditorStore.getState().editingVariationId);
  console.log('editingVariationId after clicking Edit:', editingVariationId);

  // Step 3: Make an edit (change color)
  await page.evaluate(() => {
    const store = window.useEditorStore.getState();
    store.updateWall(store.walls[0].id, { color: '#ff0000' });
  });

  // Step 4: Click Save
  console.log('Clicking Save...');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);

  // Step 5: Check localStorage right after save
  const ls2 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  const parsedLs2 = JSON.parse(ls2);
  console.log('AFTER SAVE, localStorage variations count:', parsedLs2.state.variations.length);
  
  // Check store state variations
  const memVariations = await page.evaluate(() => window.useEditorStore.getState().variations.length);
  console.log('AFTER SAVE, memory variations count:', memVariations);
  
  // Check if "Could not save" toast appeared
  const errorToast = await page.isVisible('text=Could not save');
  console.log('Error toast visible?', errorToast);

  // Go to gallery
  await page.click('button[title="Gallery"]');
  await page.waitForTimeout(500);

  // Step 6: Refresh page
  await page.reload();
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  // Step 7: Check after refresh
  const ls3 = await page.evaluate(() => localStorage.getItem('wall-paint-store'));
  const parsedLs3 = JSON.parse(ls3);
  console.log('AFTER REFRESH, localStorage variations count:', parsedLs3.state.variations.length);
});
