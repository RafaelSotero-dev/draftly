import { useState, useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import type { Project } from '@lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onOpen: (projectId: string) => void
  onRename: (projectId: string) => void
  onDuplicate: (projectId: string) => void
  onMove: (projectId: string) => void
  onDelete: (projectId: string) => void
  onSelect: (projectId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Hoje'
  } else if (diffDays === 1) {
    return 'Ontem'
  } else if (diffDays < 7) {
    return `Há ${diffDays} dias`
  } else {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

// ---------------------------------------------------------------------------
// ProjectCard component
// ---------------------------------------------------------------------------

export function ProjectCard({
  project,
  isSelected,
  onOpen,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
  onSelect,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    onSelect(project.id)
  }, [onSelect, project.id])

  const handleDoubleClick = useCallback(() => {
    onOpen(project.id)
  }, [onOpen, project.id])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onOpen(project.id)
      }
    },
    [onOpen, project.id],
  )

  function handleMenuButtonClick(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen((prev) => !prev)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu()
        menuBtnRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const formattedDate = formatDate(new Date(project.updatedAt))

  const cardClasses = [
    'project-card',
    isSelected ? 'project-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClasses}
      tabIndex={0}
      role="button"
      aria-label={`Projeto: ${project.name}`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Thumbnail */}
      <div className="project-card__thumbnail">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={`Miniatura de ${project.name}`}
            className="project-card__thumbnail-img"
          />
        ) : (
          <div
            className="project-card__thumbnail-placeholder"
            aria-hidden="true"
          >
            {getInitial(project.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="project-card__info">
        <span className="project-card__name" title={project.name}>
          {project.name}
        </span>
        <span className="project-card__date">{formattedDate}</span>
      </div>

      {/* Context menu button */}
      <div className="project-card__actions" ref={menuRef}>
        <button
          ref={menuBtnRef}
          className="project-card__actions-btn"
          aria-label={`Ações para ${project.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Mais ações"
          onClick={handleMenuButtonClick}
        >
          •••
        </button>

        {menuOpen && (
          <div
            className="context-menu project-card__context-menu"
            role="menu"
            aria-label={`Ações para ${project.name}`}
          >
            <button
              role="menuitem"
              className="context-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                closeMenu()
                onRename(project.id)
              }}
            >
              ✏️ Renomear
            </button>
            <button
              role="menuitem"
              className="context-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                closeMenu()
                onDuplicate(project.id)
              }}
            >
              📋 Duplicar
            </button>
            <button
              role="menuitem"
              className="context-menu__item"
              onClick={(e) => {
                e.stopPropagation()
                closeMenu()
                onMove(project.id)
              }}
            >
              📂 Mover
            </button>
            <button
              role="menuitem"
              className="context-menu__item context-menu__item--danger"
              onClick={(e) => {
                e.stopPropagation()
                closeMenu()
                onDelete(project.id)
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
