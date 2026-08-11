import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types'

/**
 * Generates a 200x150 PNG thumbnail from the current Excalidraw canvas state.
 * Returns a Base64-encoded data URL string, or null if generation fails
 * (e.g. canvas is empty).
 *
 * Runs asynchronously and does not block the main thread beyond the
 * exportToBlob call itself.
 *
 * Requirements: 4.2, 4.5
 */
export async function generateThumbnail(
  elements: readonly unknown[],
  appState: AppState,
  files: BinaryFiles,
): Promise<string | null> {
  // Skip generation if there are no visible elements
  if (elements.length === 0) return null

  try {
    const { exportToBlob } = await import('@excalidraw/excalidraw')

    const blob = await exportToBlob({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      elements: elements as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appState: {
        ...appState,
        exportBackground: true,
        viewBackgroundColor: '#ffffff',
      } as any,
      files,
      mimeType: 'image/png',
      getDimensions: () => ({ width: 200, height: 150, scale: 1 }),
    })

    return await blobToBase64(blob)
  } catch {
    // Thumbnail generation is best-effort — never block the save flow
    return null
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
