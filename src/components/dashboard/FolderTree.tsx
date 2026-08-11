import type { KeyboardEvent } from 'react'
import type React from 'react'
import type { Folder } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  children: FolderNode[]
}

export interface FolderTreeProps {
  folders: FolderNode[]
  selectedId: string | null
  onSelect: (folderId: string | null) => void
  level?: number
  expandedIds: Set<string>
  onToggleExpand: (folderId: string) => void
}

// ---------------------------------------------------------------------------
// Helper: build tree from flat array
// ---------------------------------------------------------------------------

export function buildTree(
  folders: Folder[],
  parentId: string | null = null,
): FolderNode[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      children: buildTree(folders, f.id),
    }))
}

// ---------------------------------------------------------------------------
// FolderItem — single row
// ---------------------------------------------------------------------------

interface FolderItemProps {
  folder: FolderNode
  selectedId: string | null
  onSelect: (folderId: string | null) => void
  level: number
  expandedIds: Set<string>
  onToggleExpand: (folderId: string) => void
  /** Injected by Sidebar to render the "..." actions button */
  renderActions?: ((folder: FolderNode) => React.ReactNode) | undefined
}

function FolderItem({
  folder,
  selectedId,
  onSelect,
  level,
  expandedIds,
  onToggleExpand,
  renderActions,
}: FolderItemProps) {
  const hasChildren = folder.children.length > 0
  const isExpanded = expandedIds.has(folder.id)
  const isSelected = selectedId === folder.id

  function handleSelect() {
    onSelect(folder.id)
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(folder.id)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLLIElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(folder.id)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (hasChildren && !isExpanded) {
        onToggleExpand(folder.id)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (isExpanded) {
        onToggleExpand(folder.id)
      }
    }
  }

  return (
    <>
      <li
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={['folder-item', isSelected ? 'folder-item--selected' : '']
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
      >
        <span
          className="folder-item__toggle"
          onClick={handleToggle}
          aria-hidden="true"
        >
          {hasChildren ? (
            isExpanded ? (
              '▼'
            ) : (
              '▶'
            )
          ) : (
            <span style={{ display: 'inline-block', width: '1em' }} />
          )}
        </span>
        <span className="folder-item__icon" aria-hidden="true">
          📁
        </span>
        <span className="folder-item__name">{folder.name}</span>
        {renderActions && (
          <span className="folder-item__actions">{renderActions(folder)}</span>
        )}
      </li>
      {hasChildren && isExpanded && (
        <FolderTree
          folders={folder.children}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          {...(renderActions ? { renderActions } : {})}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// FolderTree component
// ---------------------------------------------------------------------------

interface FolderTreeInternalProps extends FolderTreeProps {
  renderActions?: ((folder: FolderNode) => React.ReactNode) | undefined
}

export function FolderTree({
  folders,
  selectedId,
  onSelect,
  level = 0,
  expandedIds,
  onToggleExpand,
  renderActions,
}: FolderTreeInternalProps) {
  if (folders.length === 0) return null

  return (
    <ul role="group" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          {...(renderActions ? { renderActions } : {})}
        />
      ))}
    </ul>
  )
}
