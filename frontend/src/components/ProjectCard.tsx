import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Terminal,
  Trash2,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { RunnerConsoleModal } from './RunnerConsoleModal';
import { ConfirmModal } from './ConfirmModal';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
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

  return (
    <>
      <div
        className="card card-interactive"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Top row: Name & Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '0.65rem',
          }}
        >
          <Link
            to={`/projects/${project.id}`}
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {project.name}
          </Link>
          <StatusBadge status={project.status} />
        </div>

        {/* Category & Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
            {project.project_type}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={12} /> {formattedDate}
          </span>
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
          {project.description || project.readme_summary || 'No project description provided.'}
        </p>

        {/* Tech tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            marginBottom: '1.25rem',
          }}
        >
          {project.technologies?.slice(0, 4).map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.72rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies && project.technologies.length > 4 && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                padding: '0.15rem 0.35rem',
              }}
            >
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Action Buttons & Links Footer */}
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
              >
                <GithubIcon size={14} />
              </a>
            )}

            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                title="Open Live Deployment"
              >
                <ExternalLink size={14} /> Demo
              </a>
            )}

            {notebookLink && (
              <a
                href={notebookLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open Notebook"
              >
                <BookOpen size={14} />
              </a>
            )}

            {/* Run on Mac button */}
            {project.repository_url && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConsole(true)}
                title="Launch Locally on Mac"
                style={{ color: 'var(--accent-primary)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
              >
                <Terminal size={14} /> Run
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link
              to={`/projects/${project.id}`}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Details
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--text-muted)' }}
              title="Delete Project"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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

      {/* Local Runner Console Modal */}
      <RunnerConsoleModal
        projectId={project.id}
        projectName={project.name}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
      />
    </>
  );
};
