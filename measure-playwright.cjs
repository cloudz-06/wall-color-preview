const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForFunction(() => window.useEditorStore !== undefined);

  // 1. Upload room directly
  await page.evaluate(() => {
    const imgStr = 'data:image/png;base64,' + 'A'.repeat(500 * 1024); // mock 500kb image
    window.useEditorStore.getState().setImage(imgStr);
  });
  
  await page.goto('http://localhost:5173/editor');
  await page.waitForTimeout(500);

  // 2. Draw wall and save directly
  const data = await page.evaluate(async () => {
    const s = window.useEditorStore.getState();
    s.addWall();
    s.addPointToActiveWall(10, 10);
    s.addPointToActiveWall(100, 10);
    s.addPointToActiveWall(100, 100);
    s.addPointToActiveWall(10, 100);
    s.closeActiveWall();
    
    // simulate save
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    const url = canvas.toDataURL(); // tiny url
    s.saveVariation(url);
    
    return {
      rootImage: s.image,
      variation: s.variations[0]
    };
  });

  const getSize = (obj) => obj !== undefined && obj !== null ? Buffer.byteLength(JSON.stringify(obj), 'utf8') : 0;

  const measurements = {
    "originalImage size": getSize(data.rootImage), // Assuming originalImage is the root image
    "snapshot size": getSize(data.variation.snapshot),
    "walls size": getSize(data.variation.walls),
    "windows size": getSize(data.variation.windows),
    "projectName size": getSize(data.variation.projectName),
    "lighting data size": getSize(data.variation.lighting), // if any
  };

  measurements["total size"] = Object.values(measurements).reduce((a, b) => a + b, 0);

  const sorted = Object.entries(measurements)
    .filter(([k]) => k !== "total size")
    .sort((a, b) => b[1] - a[1]);

  let report = "--- MEASUREMENTS ---\n\n";
  for (const [key, size] of sorted) {
    report += `${key}: ${size.toLocaleString()} bytes\n`;
  }
  report += `\ntotal size: ${measurements["total size"].toLocaleString()} bytes\n`;
  
  console.log(report);
  await browser.close();
})();
