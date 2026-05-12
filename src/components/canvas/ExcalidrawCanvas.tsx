import React, {
  Suspense,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { Spinner } from '@components/ui/Spinner'
import type { SaveState } from '@components/ui/SaveIndicator'
import { generateThumbnail } from '@lib/thumbnail'

const AUTOSAVE_DELAY = 2000

const ExcalidrawComponent = React.lazy(() =>
  import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw })),
)

export interface ExcalidrawCanvasHandle {
  exportToFile: () => void
}

interface ExcalidrawCanvasProps {
  projectId: string
  projectName: string
  initialData: unknown
  onExport?: () => void
  onSave?: (canvasData: unknown) => Promise<void>
  onThumbnailGenerated?: (thumbnail: string) => Promise<void>
  onSaveStateChange?: (state: SaveState) => void
}

/**
 * Produces a stable string key from the elements array.
 * We only serialize the fields that represent real content changes:
 * id, type, x, y, width, height, points, text, etc.
 * We deliberately EXCLUDE: selection state, version counters, isDeleted=false
 * elements that haven't changed visually.
 *
 * Using JSON.stringify on the full elements array is sufficient because
 * Excalidraw only passes elements that have actually changed to onChange.
 */
function hashElements(elements: readonly unknown[]): string {
  // Filter out deleted elements — they don't affect the visible canvas
  const visible = (elements as Array<Record<string, unknown>>).filter(
    (el) => !el['isDeleted'],
  )
  return JSON.stringify(
    visible.map((el) => ({
      id: el['id'],
      type: el['type'],
      x: el['x'],
      y: el['y'],
      width: el['width'],
      height: el['height'],
      angle: el['angle'],
      strokeColor: el['strokeColor'],
      backgroundColor: el['backgroundColor'],
      fillStyle: el['fillStyle'],
      strokeWidth: el['strokeWidth'],
      strokeStyle: el['strokeStyle'],
      roughness: el['roughness'],
      opacity: el['opacity'],
      text: el['text'],
      fontSize: el['fontSize'],
      points: el['points'],
      src: el['src'],
    })),
  )
}

export const ExcalidrawCanvas = forwardRef<
  ExcalidrawCanvasHandle,
  ExcalidrawCanvasProps
>(function ExcalidrawCanvas(props, ref) {
  const {
    projectId,
    projectName,
    initialData,
    onExport,
    onSave,
    onThumbnailGenerated,
    onSaveStateChange,
  } = props

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)

  // All mutable state in refs — no useState to avoid re-renders
  const r = useRef({
    // Hash of the last saved elements — used to detect real content changes
    savedHash: null as string | null,
    // Whether we've captured the initial hash from the first onChange
    initialized: false,
    // Whether a save is currently in progress
    isSaving: false,
    // Debounce timer handle
    debounceTimer: null as ReturnType<typeof setTimeout> | null,
    // "Saved" indicator auto-hide timer
    savedTimer: null as ReturnType<typeof setTimeout> | null,
    // Latest prop callbacks (updated each render without causing re-renders)
    onSave: onSave as typeof onSave,
    onThumbnailGenerated: onThumbnailGenerated as typeof onThumbnailGenerated,
    onSaveStateChange: onSaveStateChange as typeof onSaveStateChange,
  })

  // Sync latest props into ref on every render
  r.current.onSave = onSave
  r.current.onThumbnailGenerated = onThumbnailGenerated
  r.current.onSaveStateChange = onSaveStateChange

  // Reset when project changes
  useEffect(() => {
    r.current.savedHash = null
    r.current.initialized = false
    r.current.isSaving = false
    if (r.current.debounceTimer) {
      clearTimeout(r.current.debounceTimer)
      r.current.debounceTimer = null
    }
    if (r.current.savedTimer) {
      clearTimeout(r.current.savedTimer)
      r.current.savedTimer = null
    }
    r.current.onSaveStateChange?.('idle')
  }, [projectId])

  useEffect(() => {
    return () => {
      if (r.current.debounceTimer) clearTimeout(r.current.debounceTimer)
      if (r.current.savedTimer) clearTimeout(r.current.savedTimer)
    }
  }, [])

  function notify(state: SaveState) {
    r.current.onSaveStateChange?.(state)
  }

  async function executeSave(
    elements: readonly unknown[],
    appState: Record<string, unknown>,
    files: unknown,
    currentHash: string,
  ) {
    if (!r.current.onSave || r.current.isSaving) return

    r.current.isSaving = true
    notify('saving')

    const canvasData = {
      type: 'excalidraw',
      version: 2,
      elements,
      appState: {
        gridSize: (appState as Record<string, unknown>)['gridSize'],
        viewBackgroundColor: (appState as Record<string, unknown>)[
          'viewBackgroundColor'
        ],
      },
      files,
    }

    try {
      await r.current.onSave(canvasData)

      // Update the saved hash AFTER successful save
      r.current.savedHash = currentHash

      notify('saved')
      if (r.current.savedTimer) clearTimeout(r.current.savedTimer)
      r.current.savedTimer = setTimeout(() => {
        r.current.savedTimer = null
        notify('idle')
      }, 3000)

      if (r.current.onThumbnailGenerated && elements.length > 0) {
        void generateThumbnail(
          elements,
          appState as unknown as Parameters<typeof generateThumbnail>[1],
          files as Parameters<typeof generateThumbnail>[2],
        )
          .then((thumb) => {
            if (thumb) r.current.onThumbnailGenerated?.(thumb)
          })
          .catch(() => {
            /* best-effort */
          })
      }
    } catch {
      notify('error')
    } finally {
      r.current.isSaving = false
    }
  }

  // Stable onChange ref — never recreated, so Excalidraw never re-registers it
  const onChangeRef = useRef(
    (elements: readonly unknown[], appState: unknown, files: unknown) => {
      if (!r.current.onSave) return

      // First onChange: capture the initial hash as the "saved" baseline.
      // This represents the state loaded from the database — no save needed.
      if (!r.current.initialized) {
        r.current.savedHash = hashElements(elements)
        r.current.initialized = true
        return
      }

      // Compute hash of current elements (content only, not scroll/zoom/selection)
      const currentHash = hashElements(elements)

      // If elements haven't changed from the last saved state, do nothing.
      if (currentHash === r.current.savedHash) return

      // Elements changed — debounce the save.
      // Cancel any pending timer and schedule a new one.
      if (r.current.debounceTimer) clearTimeout(r.current.debounceTimer)
      r.current.debounceTimer = setTimeout(() => {
        r.current.debounceTimer = null
        // Re-check: if another save already happened while we were waiting, skip
        const latestHash = hashElements(elements)
        if (latestHash === r.current.savedHash) return
        void executeSave(
          elements,
          appState as Record<string, unknown>,
          files,
          latestHash,
        )
      }, AUTOSAVE_DELAY)
    },
  )

  function exportToFile() {
    const api = apiRef.current
    if (!api) return
    const elements = api.getSceneElements()
    const appState = api.getAppState()
    const files = api.getFiles()
    const blob = new Blob(
      [
        JSON.stringify({
          type: 'excalidraw',
          version: 2,
          source: window.location.origin,
          elements,
          appState: {
            gridSize: appState.gridSize,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
          files,
        }),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.excalidraw`
    a.click()
    URL.revokeObjectURL(url)
    onExport?.()
  }

  useImperativeHandle(ref, () => ({ exportToFile }))

  const castedInitialData = initialData as
    | { elements?: unknown; appState?: unknown; files?: unknown }
    | null
    | undefined

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Spinner size="lg" label="Carregando editor…" />
          </div>
        }
      >
        <div style={{ width: '100%', height: '100%' }}>
          <ExcalidrawComponent
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialData={castedInitialData as any}
            excalidrawAPI={(api) => {
              apiRef.current = api
            }}
            onChange={onChangeRef.current}
            viewModeEnabled={false}
          />
        </div>
      </Suspense>
    </div>
  )
})
