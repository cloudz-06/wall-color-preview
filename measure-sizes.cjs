const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, 'public', 'demo-room.png');
const imgBuffer = fs.readFileSync(imgPath);
// Simulating the base64 data URL size
const base64Str = 'data:image/png;base64,' + imgBuffer.toString('base64');

// Simulate the fields of a variation based on what we know is stored
const originalImage = base64Str; 
const snapshot = base64Str; // snapshot is usually the same size or slightly different
const walls = [
  {
    "id": "wall-1",
    "label": "Wall 1",
    "points": [10, 10, 100, 10, 100, 100, 10, 100],
    "closed": true,
    "color": "#00ff00",
    "opacity": 0.6,
    "mode": "color",
    "wallpaperUrl": null,
    "wallpaperScale": 1,
    "wallpaperOpacity": 0.85,
    "cutouts": []
  }
];
const windows = [];
const projectName = "Untitled Project";
const lighting = null;

const getSize = (obj) => obj !== undefined && obj !== null ? Buffer.byteLength(JSON.stringify(obj), 'utf8') : 0;

const measurements = {
  "originalImage size": getSize(originalImage),
  "snapshot size": getSize(snapshot),
  "walls size": getSize(walls),
  "windows size": getSize(windows),
  "projectName size": getSize(projectName),
  "lighting data size": getSize(lighting),
};

const totalSize = Object.values(measurements).reduce((a, b) => a + b, 0);
measurements["total size"] = totalSize;

const sorted = Object.entries(measurements)
  .filter(([k]) => k !== "total size")
  .sort((a, b) => b[1] - a[1]);

let report = "--- LOCALSTORAGE MEASUREMENTS ---\n\n";
for (const [key, size] of sorted) {
  report += `${key}: ${size.toLocaleString()} bytes\n`;
}
report += `\ntotal size: ${measurements["total size"].toLocaleString()} bytes\n`;

console.log(report);
fs.writeFileSync('sizes_report.txt', report);
