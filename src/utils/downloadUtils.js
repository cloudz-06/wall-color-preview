/**
 * Download a canvas element as PNG or JPG.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 * @param {'png'|'jpg'} format
 * @param {number} quality  0-1 for jpg
 */
export async function downloadCanvas(canvas, filename = 'wall-preview', format = 'png', quality = 0.92) {
  const { saveAs } = await import('file-saver')
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
  canvas.toBlob(
    (blob) => {
      if (blob) saveAs(blob, `${filename}.${format}`)
    },
    mimeType,
    quality,
  )
}

/**
 * Download a dataURL as a file.
 */
export function downloadDataURL(dataURL, filename = 'wall-preview.png') {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Download multiple dataURLs as a ZIP.
 * @param {Array<{dataURL: string, filename: string}>} items
 * @param {string} zipName
 */
export async function downloadZip(items, zipName = 'wall-variations') {
  const { saveAs } = await import('file-saver')
  const JSZip = (await import('jszip')).default || (await import('jszip'))
  
  const zip = new JSZip.default ? new JSZip.default() : new JSZip()
  for (const item of items) {
    const base64 = item.dataURL.split(',')[1]
    zip.file(item.filename, base64, { base64: true })
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${zipName}.zip`)
}
