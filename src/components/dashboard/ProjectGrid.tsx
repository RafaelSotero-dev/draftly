import { useCallback } from 'react'
import type React from 'react'
import type { Project } from '@lib/prisma'
import { Spinner } from '@components/ui/Spinner'
import { ProjectCard } from './ProjectCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectGridProps {
  projects: Project[]
  isLoading: boolean
  selectedProjectId: string | null
  onOpen: (projectId: string) => void
  onRename: (projectId: string) => void
  onDuplicate: (projectId: string) => void
  onMove: (projectId: string) => void
  onDelete: (projectId: string) => void
  onSelectProject: (projectId: string | null) => void
}

// ---------------------------------------------------------------------------
// ProjectGrid component
// ---------------------------------------------------------------------------

export function ProjectGrid({
  projects,
  isLoading,
  selectedProjectId,
  onOpen,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
  onSelectProject,
}: ProjectGridProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (projects.length === 0) return

      const currentIndex = selectedProjectId
        ? projects.findIndex((p) => p.id === selectedProjectId)
        : -1

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex =
          currentIndex < projects.length - 1 ? currentIndex + 1 : 0
        const next = projects[nextIndex]
        if (next) onSelectProject(next.id)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : projects.length - 1
        const prev = projects[prevIndex]
        if (prev) onSelectProject(prev.id)
      } else if (e.key === 'Enter') {
        if (selectedProjectId) {
          e.preventDefault()
          onOpen(selectedProjectId)
        }
      } else if (e.key === 'Delete') {
        if (selectedProjectId) {
          e.preventDefault()
          onDelete(selectedProjectId)
        }
      }
    },
    [projects, selectedProjectId, onSelectProject, onOpen, onDelete],
  )

  if (isLoading) {
    return (
      <div className="project-grid project-grid--loading" aria-busy="true">
        <Spinner size="lg" label="Carregando projetos" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="project-grid project-grid--empty">
        <p className="project-grid__empty-message">
          Nenhum projeto nesta pasta.
          <br />
          Clique em &ldquo;Novo projeto&rdquo; para começar.
        </p>
      </div>
    )
  }

  return (
    <div
      className="project-grid"
      role="grid"
      aria-label="Projetos"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        // Deselect when clicking on the grid background
        if (e.target === e.currentTarget) {
          onSelectProject(null)
        }
      }}
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedProjectId === project.id}
          onOpen={onOpen}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onMove={onMove}
          onDelete={onDelete}
          onSelect={onSelectProject}
        />
      ))}
    </div>
  )
}
