import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { getProject, saveCanvas, uploadThumbnail } from '@/api/projects'
import type { Project } from '@/api/projects'
import { Spinner } from '@components/ui/Spinner'
import { SaveIndicator } from '@components/ui/SaveIndicator'
import type { SaveState } from '@components/ui/SaveIndicator'
import {
  ExcalidrawCanvas,
  type ExcalidrawCanvasHandle,
} from '@components/canvas/ExcalidrawCanvas'

type EditorState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: Project }

function EditorHeader({
  projectName,
  saveState,
  onBack,
  onExport,
}: {
  projectName?: string
  saveState?: SaveState
  onBack: () => void
  onExport?: () => void
}) {
  return (
    <header className="editor-header">
      <button
        className="editor-back-btn"
        onClick={onBack}
        aria-label="Voltar ao Dashboard"
      >
        ← Voltar
      </button>

      {projectName !== undefined && (
        <span className="editor-project-name">{projectName}</span>
      )}

      {/* Right side: save indicator + export button */}
      <div className="editor-header-actions">
        {saveState !== undefined && saveState !== 'idle' && (
          <SaveIndicator state={saveState} />
        )}
        {onExport !== undefined && (
          <button
            className="editor-back-btn"
            onClick={onExport}
            aria-label="Exportar projeto como arquivo .excalidraw"
          >
            ↓ Exportar
          </button>
        )}
      </div>
    </header>
  )
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [state, setState] = useState<EditorState>({ status: 'loading' })
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const canvasRef = useRef<ExcalidrawCanvasHandle | null>(null)

  const handleBack = () => navigate('/')
  const handleExport = () => canvasRef.current?.exportToFile()

  useEffect(() => {
    if (!id || !user) return

    let cancelled = false

    getProject(user.id, id)
      .then((project) => {
        if (!cancelled) {
          setState({ status: 'ready', project })
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const is404 =
          err instanceof Error &&
          (err.message.includes('404') || err.message.includes('not found'))
        if (is404) {
          setState({ status: 'not-found' })
        } else {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Erro desconhecido',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, user])

  if (state.status === 'loading') {
    return (
      <div className="editor-page">
        <EditorHeader onBack={handleBack} />
        <div className="editor-canvas editor-canvas--center">
          <Spinner size="lg" label="Carregando projeto…" />
        </div>
      </div>
    )
  }

  if (state.status === 'not-found') {
    return (
      <div className="editor-page">
        <EditorHeader onBack={handleBack} />
        <div className="editor-canvas editor-canvas--center">
          <p>Projeto não encontrado.</p>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="editor-page">
        <EditorHeader onBack={handleBack} />
        <div className="editor-canvas editor-canvas--center">
          <p>Erro ao carregar projeto: {state.message}</p>
        </div>
      </div>
    )
  }

  const { project } = state

  const handleSave = async (canvasData: unknown) => {
    if (!user) return
    await saveCanvas(user.id, project.id, canvasData)
  }

  const handleThumbnail = async (thumbnail: string) => {
    if (!user) return
    await uploadThumbnail(user.id, project.id, thumbnail)
  }

  return (
    <div className="editor-page">
      <EditorHeader
        projectName={project.name}
        saveState={saveState}
        onBack={handleBack}
        onExport={handleExport}
      />
      <div
        style={{ flex: 1, overflow: 'hidden', height: 'calc(100vh - 48px)' }}
      >
        <ExcalidrawCanvas
          ref={canvasRef}
          projectId={project.id}
          projectName={project.name}
          initialData={project.canvasData}
          onSave={handleSave}
          onThumbnailGenerated={handleThumbnail}
          onSaveStateChange={setSaveState}
        />
      </div>
    </div>
  )
}
