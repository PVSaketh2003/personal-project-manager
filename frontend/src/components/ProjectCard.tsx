import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Terminal,
  Trash2,
  BookOpen,
  Cpu,
  Globe,
  Database,
  Code,
} from 'lucide-react';
import { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { RunnerConsoleModal } from './RunnerConsoleModal';
import { ConfirmModal } from './ConfirmModal';
import { GithubIcon } from './GithubIcon';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  layout?: 'grid' | 'list';
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  layout = 'grid',
}) => {
  const [showConsole, setShowConsole] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formattedDate = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const notebookLink =
    project.notebook_urls && project.notebook_urls.length > 0
      ? project.notebook_urls[0]
      : null;

  // Visual Category Icon selection
  const getCategoryIcon = () => {
    switch (project.project_type) {
      case 'Machine Learning / Edge AI':
        return <Cpu size={14} color="var(--secondary-accent)" />;
      case 'Web Application':
        return <Globe size={14} color="var(--primary-accent)" />;
      case 'Backend API':
        return <Database size={14} color="var(--success)" />;
      default:
        return <Code size={14} color="var(--highlight)" />;
    }
  };

  // Monogram for project identity
  const initials = project.name
    ? project.name
        .split(/[-_ ]+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PR';

  if (layout === 'list') {
    return (
      <>
        <div
          className="aurora-card aurora-card-interactive"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--secondary-accent)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {initials}
            </div>
            <div>
              <Link
                to={`/projects/${project.id}`}
                style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.98rem' }}
              >
                {project.name}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {getCategoryIcon()} {project.project_type}
                </span>
                <span>•</span>
                <span>Updated {formattedDate}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge status={project.status} />
            {project.technologies?.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '0.72rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.15rem 0.45rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-cyan btn-sm"
                title="Open Live Demo"
              >
                <ExternalLink size={12} /> Demo
              </a>
            )}

            {project.repository_url && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConsole(true)}
                title="Launch locally on Mac"
                style={{ color: 'var(--secondary-accent)' }}
              >
                <Terminal size={12} /> Run
              </button>
            )}

            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open GitHub"
              >
                <GithubIcon size={13} />
              </a>
            )}

            <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm">
              Details
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--text-muted)' }}
              title="Delete Project"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Project"
          message={`Are you sure you want to delete "${project.name}"?`}
          confirmLabel="Delete"
          isDestructive={true}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete(project.id);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />

        <RunnerConsoleModal
          projectId={project.id}
          projectName={project.name}
          isOpen={showConsole}
          onClose={() => setShowConsole(false)}
        />
      </>
    );
  }

  // Standard Grid Layout
  return (
    <>
      <div
        className="aurora-card aurora-card-interactive"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      >
        <div className="aurora-glow-top" />

        {/* Top Header: Identity & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--secondary-accent)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <Link
                to={`/projects/${project.id}`}
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  display: 'block',
                }}
              >
                {project.name}
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {getCategoryIcon()}
                <span>{project.project_type}</span>
              </div>
            </div>
          </div>

          <StatusBadge status={project.status} />
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description || project.readme_summary || 'No description provided.'}
        </p>

        {/* Tech tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {project.technologies?.slice(0, 4).map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.72rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-muted)',
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies && project.technologies.length > 4 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.15rem 0.35rem' }}>
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        {/* Footer Meta & Actions */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open GitHub Repository"
                style={{ padding: '0.35rem 0.55rem' }}
              >
                <GithubIcon size={14} />
              </a>
            )}

            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-cyan btn-sm"
                title="Open Live Deployment"
              >
                <ExternalLink size={12} /> Demo
              </a>
            )}

            {notebookLink && (
              <a
                href={notebookLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open Notebook"
                style={{ padding: '0.35rem 0.55rem' }}
              >
                <BookOpen size={13} />
              </a>
            )}

            {project.repository_url && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConsole(true)}
                title="Launch Locally on Mac"
                style={{ color: 'var(--secondary-accent)', borderColor: 'var(--border-cyan)' }}
              >
                <Terminal size={12} /> Run
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              Details
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--text-muted)', padding: '0.35rem 0.5rem' }}
              title="Delete Project"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will remove the project from PostgreSQL and ChromaDB.`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(project.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

      <RunnerConsoleModal
        projectId={project.id}
        projectName={project.name}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
      />
    </>
  );
};
