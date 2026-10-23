const MAX_DIMENSION = 1920

/** Load an HTMLImageElement from a data URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Invalid image'))
    img.src = src
  })
}

/**
 * Read an image File, downscale it to at most MAX_DIMENSION px on the
 * longest side, and return a JPEG data URL. Downscaling keeps the result
 * small enough for localStorage (photos can easily be 10MB+ raw).
 */
export async function fileToDataURL(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Not an image file')
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

  try {
    const img = await loadImage(rawDataUrl)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return rawDataUrl
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    // Fall back to the original if decoding/scaling fails
    return rawDataUrl
  }
}
