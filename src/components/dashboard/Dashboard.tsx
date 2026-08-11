import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useProjects } from '@hooks/useProjects'
import { useFolders } from '@hooks/useFolders'
import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { Sidebar } from './Sidebar'
import { ProjectGrid } from './ProjectGrid'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'excalidraw-clone:dashboard:selectedFolderId'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readStoredFolderId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredFolderId(folderId: string | null): void {
  try {
    if (folderId === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, folderId)
    }
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Dashboard component
// ---------------------------------------------------------------------------

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { folders } = useFolders()
  const navigate = useNavigate()

  // Persisted folder selection
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    readStoredFolderId,
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )

  const {
    projects,
    isLoading,
    createProject,
    renameProject,
    moveProject,
    deleteProject,
    duplicateProject,
  } = useProjects(selectedFolderId ?? undefined)

  // Persist folder selection
  useEffect(() => {
    writeStoredFolderId(selectedFolderId)
  }, [selectedFolderId])

  // -------------------------------------------------------------------------
  // New project modal
  // -------------------------------------------------------------------------

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectFolderId, setNewProjectFolderId] = useState('')
  const [newProjectError, setNewProjectError] = useState<string | undefined>(
    undefined,
  )
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const newProjectInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNewProjectModalOpen) {
      setTimeout(() => newProjectInputRef.current?.focus(), 50)
    }
  }, [isNewProjectModalOpen])

  function handleNewProjectClick() {
    setNewProjectName('')
    setNewProjectFolderId('')
    setNewProjectError(undefined)
    setIsNewProjectModalOpen(true)
  }

  async function handleNewProjectSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!name) {
      setNewProjectError('Nome não pode ser vazio')
      return
    }
    // Use the pre-selected folder or the one chosen in the modal
    const folderId = selectedFolderId ?? newProjectFolderId
    if (!folderId) {
      setNewProjectError('Selecione uma pasta para o projeto')
      return
    }
    setIsCreatingProject(true)
    setNewProjectError(undefined)
    try {
      const created = await createProject({ name, folderId })
      setIsNewProjectModalOpen(false)
      setSelectedProjectId(created.id)
    } catch {
      setNewProjectError('Erro ao criar projeto. Tente novamente.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  function handleNewProjectCancel() {
    setIsNewProjectModalOpen(false)
  }

  // -------------------------------------------------------------------------
  // Rename project modal
  // -------------------------------------------------------------------------

  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null,
  )
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | undefined>(undefined)
  const [isRenaming, setIsRenaming] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingProjectId) {
      setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 50)
    }
  }, [renamingProjectId])

  function handleRenameStart(projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    setRenamingProjectId(projectId)
    setRenameValue(project.name)
    setRenameError(undefined)
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!renamingProjectId) return
    const name = renameValue.trim()
    if (!name) {
      setRenameError('Nome não pode ser vazio')
      return
    }
    setIsRenaming(true)
    setRenameError(undefined)
    try {
      await renameProject(renamingProjectId, name)
      setRenamingProjectId(null)
    } catch {
      setRenameError('Erro ao renomear projeto')
    } finally {
      setIsRenaming(false)
    }
  }

  function handleRenameCancel() {
    setRenamingProjectId(null)
    setRenameError(undefined)
  }

  // -------------------------------------------------------------------------
  // Delete project modal
  // -------------------------------------------------------------------------

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const deletingProject = deletingProjectId
    ? (projects.find((p) => p.id === deletingProjectId) ?? null)
    : null

  function handleDeleteStart(projectId: string) {
    setDeletingProjectId(projectId)
  }

  async function handleDeleteConfirm() {
    if (!deletingProjectId) return
    setIsDeleting(true)
    try {
      await deleteProject(deletingProjectId)
      if (selectedProjectId === deletingProjectId) {
        setSelectedProjectId(null)
      }
      setDeletingProjectId(null)
    } catch {
      setDeletingProjectId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleDeleteCancel() {
    setDeletingProjectId(null)
  }

  // -------------------------------------------------------------------------
  // Duplicate project
  // -------------------------------------------------------------------------

  async function handleDuplicate(projectId: string) {
    try {
      const duplicated = await duplicateProject(projectId)
      setSelectedProjectId(duplicated.id)
    } catch {
      // error handled by hook
    }
  }

  // -------------------------------------------------------------------------
  // Move project modal
  // -------------------------------------------------------------------------

  const [movingProjectId, setMovingProjectId] = useState<string | null>(null)
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>('')
  const [isMoveLoading, setIsMoveLoading] = useState(false)
  const [moveError, setMoveError] = useState<string | undefined>(undefined)

  function handleMoveStart(projectId: string) {
    setMovingProjectId(projectId)
    setMoveTargetFolderId('')
    setMoveError(undefined)
  }

  async function handleMoveConfirm() {
    if (!movingProjectId || !moveTargetFolderId) {
      setMoveError('Selecione uma pasta de destino')
      return
    }
    setIsMoveLoading(true)
    setMoveError(undefined)
    try {
      await moveProject(movingProjectId, moveTargetFolderId)
      setMovingProjectId(null)
    } catch {
      setMoveError('Erro ao mover projeto')
    } finally {
      setIsMoveLoading(false)
    }
  }

  function handleMoveCancel() {
    setMovingProjectId(null)
    setMoveError(undefined)
  }

  // -------------------------------------------------------------------------
  // Open project
  // -------------------------------------------------------------------------

  function handleOpenProject(projectId: string) {
    navigate(`/project/${projectId}`)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <Sidebar
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
      />

      {/* Main area */}
      <div className="dashboard__main">
        {/* Header */}
        <header className="dashboard__header">
          <span className="dashboard__title">Draftly</span>

          <div className="dashboard__header-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewProjectClick}
              title="Criar novo projeto"
            >
              + Novo projeto
            </Button>
          </div>

          <div className="dashboard__user">
            <span className="dashboard__user-email">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sair
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard__content">
          <ProjectGrid
            projects={projects}
            isLoading={isLoading}
            selectedProjectId={selectedProjectId}
            onOpen={handleOpenProject}
            onRename={handleRenameStart}
            onDuplicate={(id) => void handleDuplicate(id)}
            onMove={handleMoveStart}
            onDelete={handleDeleteStart}
            onSelectProject={setSelectedProjectId}
          />
        </main>
      </div>

      {/* ── New project modal ── */}
      {isNewProjectModalOpen && (
        <div
          className="ui-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleNewProjectCancel()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-modal-title"
        >
          <div className="ui-modal">
            <h2 id="new-project-modal-title" className="ui-modal__title">
              Novo projeto
            </h2>
            <form
              onSubmit={(e) => {
                void handleNewProjectSubmit(e)
              }}
            >
              <div className="ui-input-field">
                <label
                  className="ui-input-label"
                  htmlFor="new-project-name-input"
                >
                  Nome do projeto
                </label>
                <input
                  id="new-project-name-input"
                  ref={newProjectInputRef}
                  className={[
                    'ui-input',
                    newProjectError ? 'ui-input--error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleNewProjectCancel()
                  }}
                  placeholder="Ex: Meu diagrama"
                  aria-label="Nome do novo projeto"
                  aria-invalid={newProjectError ? 'true' : undefined}
                />
              </div>

              {/* Folder selector — shown when no folder is pre-selected */}
              {!selectedFolderId && (
                <div className="ui-input-field" style={{ marginTop: '14px' }}>
                  <label
                    className="ui-input-label"
                    htmlFor="new-project-folder-select"
                  >
                    Pasta
                  </label>
                  <select
                    id="new-project-folder-select"
                    className="ui-input"
                    value={newProjectFolderId}
                    onChange={(e) => setNewProjectFolderId(e.target.value)}
                    aria-label="Selecionar pasta para o projeto"
                  >
                    <option value="">Selecione uma pasta…</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  {folders.length === 0 && (
                    <span className="ui-input-hint">
                      Crie uma pasta na sidebar antes de criar um projeto.
                    </span>
                  )}
                </div>
              )}

              {newProjectError && (
                <span
                  className="ui-input-error"
                  role="alert"
                  style={{ marginTop: '8px', display: 'block' }}
                >
                  {newProjectError}
                </span>
              )}

              <div className="ui-modal__actions" style={{ marginTop: '20px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleNewProjectCancel}
                  disabled={isCreatingProject}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isCreatingProject}
                >
                  Criar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rename project modal ── */}
      {renamingProjectId && (
        <div
          className="ui-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleRenameCancel()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-project-modal-title"
        >
          <div className="ui-modal">
            <h2 id="rename-project-modal-title" className="ui-modal__title">
              Renomear projeto
            </h2>
            <form
              onSubmit={(e) => {
                void handleRenameSubmit(e)
              }}
            >
              <div className="ui-input-field">
                <label
                  className="ui-input-label"
                  htmlFor="rename-project-input"
                >
                  Novo nome
                </label>
                <input
                  id="rename-project-input"
                  ref={renameInputRef}
                  className={['ui-input', renameError ? 'ui-input--error' : '']
                    .filter(Boolean)
                    .join(' ')}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleRenameCancel()
                  }}
                  aria-label="Novo nome do projeto"
                  aria-invalid={renameError ? 'true' : undefined}
                />
                {renameError && (
                  <span className="ui-input-error" role="alert">
                    {renameError}
                  </span>
                )}
              </div>
              <div className="ui-modal__actions" style={{ marginTop: '20px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRenameCancel}
                  disabled={isRenaming}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isRenaming}>
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete project modal ── */}
      <Modal
        isOpen={deletingProjectId !== null}
        title="Excluir projeto"
        message={
          deletingProject
            ? `Tem certeza que deseja excluir "${deletingProject.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel={isDeleting ? 'Excluindo…' : 'Excluir'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />

      {/* ── Move project modal ── */}
      {movingProjectId && (
        <div
          className="ui-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleMoveCancel()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-project-modal-title"
        >
          <div className="ui-modal">
            <h2 id="move-project-modal-title" className="ui-modal__title">
              Mover projeto
            </h2>
            <div className="ui-input-field">
              <label
                className="ui-input-label"
                htmlFor="move-project-folder-select"
              >
                Pasta de destino
              </label>
              <select
                id="move-project-folder-select"
                className="ui-input"
                value={moveTargetFolderId}
                onChange={(e) => setMoveTargetFolderId(e.target.value)}
                aria-label="Selecionar pasta de destino"
              >
                <option value="">Selecione uma pasta…</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              {moveError && (
                <span className="ui-input-error" role="alert">
                  {moveError}
                </span>
              )}
            </div>
            <div className="ui-modal__actions" style={{ marginTop: '20px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleMoveCancel}
                disabled={isMoveLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isMoveLoading}
                onClick={() => void handleMoveConfirm()}
              >
                Mover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
