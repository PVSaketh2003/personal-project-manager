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
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { RunnerConsoleModal } from './RunnerConsoleModal';
import { ConfirmModal } from './ConfirmModal';
import { GithubIcon } from './GithubIcon';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  layout?: 'grid' | 'list';
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  layout = 'grid',
}) => {
  const [showConsole, setShowConsole] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localStatus, setLocalStatus] = useState(project.local_status);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Machine Learning / Edge AI':
        return <Cpu size={14} />;
      case 'Data Science & Analytics':
        return <Database size={14} />;
      case 'Backend API':
        return <Terminal size={14} />;
      case 'Jupyter Notebook':
        return <BookOpen size={14} />;
      case 'Web Application':
      default:
        return <Globe size={14} />;
    }
  };

  const isRunning = localStatus === 'running';

  // ---------------- LIST VIEW LAYOUT ----------------
  if (layout === 'list') {
    return (
      <>
        <div
          className="obs-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            marginBottom: '0.65rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-structural)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.78rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Link
                  to={`/projects/${project.id}`}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {project.name}
                </Link>
                <StatusBadge status={project.status} />
                {isRunning && (
                  <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                    <Radio size={10} className="pulse" /> RUNNING
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {project.project_type} • {project.primary_language || 'General'} • Updated {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {project.repository_url && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConsole(true)}
                title="Launch on Localhost"
              >
                <Terminal size={12} /> {isRunning ? 'Console' : 'Run'}
              </button>
            )}

            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open Live Deployment"
              >
                <ExternalLink size={12} /> Demo
              </a>
            )}

            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="View GitHub Repository"
              >
                <GithubIcon size={12} /> Repo
              </a>
            )}

            <Link to={`/projects/${project.id}`} className="btn btn-primary btn-sm">
              Inspect <ArrowUpRight size={12} />
            </Link>

            {onDelete && (
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setShowDeleteModal(true)}
                title="Delete project"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <RunnerConsoleModal
          projectId={project.id}
          projectName={project.name}
          isOpen={showConsole}
          onClose={() => setShowConsole(false)}
          onStatusChange={(st) => setLocalStatus(st as any)}
        />

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Project Entry"
          message={`Are you sure you want to permanently delete "${project.name}" from your catalog and database?`}
          isDestructive={true}
          onConfirm={() => {
            setShowDeleteModal(false);
            if (onDelete) onDelete(project.id);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      </>
    );
  }

  // ---------------- GRID VIEW LAYOUT ----------------
  return (
    <>
      <div
        className="obs-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '260px',
        }}
      >
        <span className="obs-corner-mark top-right">
          {project.primary_language ? `[${project.primary_language.toUpperCase()}]` : '[SPEC]'}
        </span>

        <div>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-structural)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                <Link
                  to={`/projects/${project.id}`}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {project.name}
                </Link>
                {isRunning && (
                  <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', fontSize: '0.62rem' }}>
                    <Radio size={9} className="pulse" /> LIVE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {getCategoryIcon(project.project_type)} {project.project_type}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div style={{ marginBottom: '0.85rem' }}>
            <StatusBadge status={project.status} />
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description || 'No description cataloged for this repository.'}
          </p>

          {/* Technologies Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
            {project.technologies?.slice(0, 4).map((tech) => (
              <span
                key={tech}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.68rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-structural)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '2px',
                  color: 'var(--text-secondary)',
                }}
              >
                {tech}
              </span>
            ))}
            {project.technologies?.length > 4 && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  padding: '0.15rem 0.25rem',
                }}
              >
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-structural)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="btn-icon"
                title="View GitHub Repository"
                style={{ color: 'var(--text-secondary)', padding: '0.35rem' }}
              >
                <GithubIcon size={14} />
              </a>
            )}

            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn-icon"
                title="Open Live Deployment"
                style={{ color: 'var(--text-secondary)', padding: '0.35rem' }}
              >
                <ExternalLink size={14} />
              </a>
            )}

            {project.repository_url && (
              <button
                className="btn-icon"
                onClick={() => setShowConsole(true)}
                title="Localhost Terminal"
                style={{ color: 'var(--text-secondary)', padding: '0.35rem' }}
              >
                <Terminal size={14} />
              </button>
            )}

            {onDelete && (
              <button
                className="btn-icon"
                onClick={() => setShowDeleteModal(true)}
                title="Delete project"
                style={{ color: 'var(--danger)', padding: '0.35rem' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.65rem' }}>
            Inspect <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      <RunnerConsoleModal
        projectId={project.id}
        projectName={project.name}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        onStatusChange={(st) => setLocalStatus(st as any)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project Entry"
        message={`Are you sure you want to permanently delete "${project.name}" from your catalog and database?`}
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteModal(false);
          if (onDelete) onDelete(project.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};
