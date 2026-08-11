import { useState, useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import { useFolders } from '@hooks/useFolders'
import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { FolderTree, buildTree } from './FolderTree'
import type { FolderNode } from './FolderTree'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarProps {
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
}

interface ContextMenuState {
  folder: FolderNode
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar({ selectedFolderId, onSelectFolder }: SidebarProps) {
  const { folders, isLoading, createFolder, renameFolder, deleteFolder } =
    useFolders()

  // Expanded state for tree nodes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // "Nova pasta" inline creation
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [createError, setCreateError] = useState<string | undefined>(undefined)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [renamingFolder, setRenamingFolder] = useState<FolderNode | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | undefined>(undefined)
  const [isRenameLoading, setIsRenameLoading] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation modal
  const [deletingFolder, setDeletingFolder] = useState<FolderNode | null>(null)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  // Build tree from flat folders array
  const tree = buildTree(folders)

  // -------------------------------------------------------------------------
  // Expand/collapse
  // -------------------------------------------------------------------------

  const handleToggleExpand = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // -------------------------------------------------------------------------
  // "Nova pasta" flow
  // -------------------------------------------------------------------------

  function handleNewFolderClick() {
    setIsCreating(true)
    setNewFolderName('')
    setCreateError(undefined)
  }

  useEffect(() => {
    if (isCreating) {
      newFolderInputRef.current?.focus()
    }
  }, [isCreating])

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = newFolderName.trim()
    if (!name) {
      setCreateError('Nome não pode ser vazio')
      return
    }
    setIsCreateLoading(true)
    setCreateError(undefined)
    try {
      const created = await createFolder({
        name,
        parentId: selectedFolderId ?? null,
      })
      setIsCreating(false)
      setNewFolderName('')
      // Auto-expand parent if we created inside a folder
      if (selectedFolderId) {
        setExpandedIds((prev) => new Set([...prev, selectedFolderId]))
      }
      // Select the newly created folder
      onSelectFolder(created.id)
    } catch {
      setCreateError('Erro ao criar pasta')
    } finally {
      setIsCreateLoading(false)
    }
  }

  function handleCreateCancel() {
    setIsCreating(false)
    setNewFolderName('')
    setCreateError(undefined)
  }

  function handleCreateKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCreateCancel()
    }
  }

  // -------------------------------------------------------------------------
  // Context menu
  // -------------------------------------------------------------------------

  function handleActionsButtonClick(folder: FolderNode, e: React.MouseEvent) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setContextMenu({ folder, x: rect.left, y: rect.bottom + 4 })
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return

    function handleClick(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeContextMenu()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  // -------------------------------------------------------------------------
  // Rename flow
  // -------------------------------------------------------------------------

  function handleRenameStart(folder: FolderNode) {
    closeContextMenu()
    setRenamingFolder(folder)
    setRenameValue(folder.name)
    setRenameError(undefined)
  }

  useEffect(() => {
    if (renamingFolder) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingFolder])

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!renamingFolder) return
    const name = renameValue.trim()
    if (!name) {
      setRenameError('Nome não pode ser vazio')
      return
    }
    setIsRenameLoading(true)
    setRenameError(undefined)
    try {
      await renameFolder(renamingFolder.id, name)
      setRenamingFolder(null)
    } catch {
      setRenameError('Erro ao renomear pasta')
    } finally {
      setIsRenameLoading(false)
    }
  }

  function handleRenameCancel() {
    setRenamingFolder(null)
    setRenameError(undefined)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleRenameCancel()
    }
  }

  // -------------------------------------------------------------------------
  // Delete flow
  // -------------------------------------------------------------------------

  function handleDeleteStart(folder: FolderNode) {
    closeContextMenu()
    setDeletingFolder(folder)
  }

  async function handleDeleteConfirm() {
    if (!deletingFolder) return
    setIsDeleteLoading(true)
    try {
      await deleteFolder(deletingFolder.id)
      // If the deleted folder was selected, go back to root
      if (selectedFolderId === deletingFolder.id) {
        onSelectFolder(null)
      }
      setDeletingFolder(null)
    } catch {
      // Error is handled by the hook; just close the modal
      setDeletingFolder(null)
    } finally {
      setIsDeleteLoading(false)
    }
  }

  function handleDeleteCancel() {
    setDeletingFolder(null)
  }

  // -------------------------------------------------------------------------
  // Render actions button for each folder item
  // -------------------------------------------------------------------------

  function renderActions(folder: FolderNode) {
    return (
      <button
        className="folder-item__actions-btn"
        aria-label={`Ações para ${folder.name}`}
        title="Mais ações"
        onClick={(e) => handleActionsButtonClick(folder, e)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        ···
      </button>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isRootSelected = selectedFolderId === null

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar__header">
        <span className="sidebar__title">Pastas</span>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Criar nova pasta"
          onClick={handleNewFolderClick}
          disabled={isCreating}
        >
          + Nova pasta
        </Button>
      </div>

      {/* Tree area */}
      <div className="sidebar__tree">
        {/* "Todos os projetos" root item */}
        <ul role="tree" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li
            role="treeitem"
            aria-selected={isRootSelected}
            tabIndex={0}
            className={[
              'folder-item',
              isRootSelected ? 'folder-item--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ paddingLeft: '8px' }}
            onClick={() => onSelectFolder(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectFolder(null)
              }
            }}
          >
            <span className="folder-item__toggle" aria-hidden="true">
              <span style={{ display: 'inline-block', width: '1em' }} />
            </span>
            <span className="folder-item__icon" aria-hidden="true">
              🏠
            </span>
            <span className="folder-item__name">Todos os projetos</span>
          </li>

          {/* Folder tree — rendered inside the same role="tree" list */}
          {isLoading ? (
            <li
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              Carregando…
            </li>
          ) : (
            <FolderTree
              folders={tree}
              selectedId={selectedFolderId}
              onSelect={onSelectFolder}
              level={0}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              renderActions={renderActions}
            />
          )}
        </ul>

        {/* Inline "Nova pasta" form */}
        {isCreating && (
          <form
            className="sidebar__new-folder-form"
            onSubmit={(e) => {
              void handleCreateSubmit(e)
            }}
          >
            <div className="ui-input-field">
              <input
                ref={newFolderInputRef}
                className={['ui-input', createError ? 'ui-input--error' : '']
                  .filter(Boolean)
                  .join(' ')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder="Nome da pasta"
                aria-label="Nome da nova pasta"
                aria-invalid={createError ? 'true' : undefined}
              />
              {createError && (
                <span className="ui-input-error" role="alert">
                  {createError}
                </span>
              )}
            </div>
            <div className="sidebar__new-folder-actions">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isCreateLoading}
              >
                Criar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCreateCancel}
                disabled={isCreateLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          role="menu"
          aria-label="Ações da pasta"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            role="menuitem"
            className="context-menu__item"
            onClick={() => handleRenameStart(contextMenu.folder)}
          >
            ✏️ Renomear
          </button>
          <button
            role="menuitem"
            className="context-menu__item context-menu__item--danger"
            onClick={() => handleDeleteStart(contextMenu.folder)}
          >
            🗑️ Excluir
          </button>
        </div>
      )}

      {/* Rename inline modal */}
      {renamingFolder && (
        <div
          className="ui-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleRenameCancel()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-modal-title"
        >
          <div className="ui-modal">
            <h2 id="rename-modal-title" className="ui-modal__title">
              Renomear pasta
            </h2>
            <form
              onSubmit={(e) => {
                void handleRenameSubmit(e)
              }}
            >
              <div className="ui-input-field">
                <label className="ui-input-label" htmlFor="rename-folder-input">
                  Novo nome
                </label>
                <input
                  id="rename-folder-input"
                  ref={renameInputRef}
                  className={['ui-input', renameError ? 'ui-input--error' : '']
                    .filter(Boolean)
                    .join(' ')}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  aria-label="Novo nome da pasta"
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
                  disabled={isRenameLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isRenameLoading}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deletingFolder !== null}
        title="Excluir pasta"
        message={
          deletingFolder
            ? `Tem certeza que deseja excluir "${deletingFolder.name}"? Esta ação também excluirá todas as subpastas e projetos dentro dela.`
            : ''
        }
        confirmLabel={isDeleteLoading ? 'Excluindo…' : 'Excluir'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
        onCancel={handleDeleteCancel}
      />
    </aside>
  )
}
