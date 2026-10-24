import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  FolderTree,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
  Edit,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { AgentTask, Project, ProjectStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RunnerConsoleModal } from '../components/RunnerConsoleModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState<ProjectStatus>('In Development');
  const [editDeploymentUrl, setEditDeploymentUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const loadProjectData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await api.getProject(id);
      setProject(p);
      setEditStatus(p.status);
      setEditDeploymentUrl(p.deployment_url || '');
      setEditNotes(p.project_notes || '');

      // Load agent activity history for this project
      const tasksRes = await api.getAgentTasks(10, id);
      setTasks(tasksRes.items);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const handleReanalyze = async () => {
    if (!id) return;
    setReanalyzing(true);
    try {
      const updated = await api.reanalyzeProject(id);
      setProject(updated);
    } catch (err) {
      console.error('Reanalysis failed:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      const updated = await api.updateProject(id, {
        status: editStatus,
        deployment_url: editDeploymentUrl.trim() || null,
        project_notes: editNotes.trim() || null,
      });
      setProject(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Deletion failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <Loader2 size={32} className="spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Project not found</h2>
        <Link to="/projects" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>
    );
  }

  const analysis = project.repository_analysis_metadata;

  return (
    <div>
      {/* Back button */}
      <Link
        to="/projects"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex' }}
      >
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                {project.project_type}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Created: {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {project.repository_url && (
              <button
                className="btn btn-primary"
                onClick={() => setShowConsole(true)}
              >
                <Play size={16} /> Launch on Localhost
              </button>
            )}

            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={16} /> Live Demo
              </a>
            )}

            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <GithubIcon size={16} /> GitHub
              </a>
            )}

            {project.repository_url && (
              <button
                className="btn btn-secondary"
                onClick={handleReanalyze}
                disabled={reanalyzing}
                title="Re-fetch latest GitHub metadata"
              >
                <RefreshCw size={14} className={reanalyzing ? 'spin' : ''} />
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit size={14} /> Edit
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Quick Edit Drawer if editing */}
        {isEditing && (
          <div
            style={{
              background: 'var(--bg-tertiary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              margin: '1.25rem 0',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Quick Update Project Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                >
                  <option value="In Development">In Development</option>
                  <option value="Completed">Completed</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Planning">Planning</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="form-label">Live Deployment URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editDeploymentUrl}
                  onChange={(e) => setEditDeploymentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Internal Engineering Notes</label>
              <textarea
                className="form-textarea"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {project.description || 'No description provided.'}
        </p>

        {/* Technologies Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {project.technologies?.map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.8rem',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 500,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: 2 Columns for Tech Specifications and Manifests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Architecture & Frameworks */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} color="var(--accent-primary)" />
            Stack & Architecture
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Language</span>
              <span style={{ fontWeight: 500 }}>{project.primary_language || 'None detected'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frontend Framework</span>
              <span style={{ fontWeight: 500 }}>{project.frontend_framework || 'None (Undeployed / Backend)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Framework</span>
              <span style={{ fontWeight: 500 }}>{project.backend_framework || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database</span>
              <span style={{ fontWeight: 500 }}>{project.database_technology || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Local Execution Status</span>
              <span style={{ fontWeight: 600, color: project.local_status === 'running' ? 'var(--success)' : 'var(--text-secondary)' }}>
                {project.local_status}
              </span>
            </div>
          </div>
        </div>

        {/* Notebooks & Documentation */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-primary)" />
            Notebooks & Links
          </h3>
          {project.notebook_urls && project.notebook_urls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {project.notebook_urls.map((nbUrl, idx) => (
                <a
                  key={idx}
                  href={nbUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--info)',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                    background: 'var(--bg-tertiary)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <BookOpen size={14} /> {nbUrl}
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No Jupyter or Google Colab notebooks detected in repository.
            </p>
          )}

          {project.project_notes && (
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Engineering Notes:
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                {project.project_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* README Summary */}
      {project.readme_summary && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            README Content Summary
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {project.readme_summary}
          </p>
        </div>
      )}

      {/* Directory Sample & Entry Points if available */}
      {analysis && analysis.directory_tree_sample && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderTree size={18} color="var(--accent-primary)" />
            Detected Directory Sample
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {analysis.directory_tree_sample.map((p: string, idx: number) => (
              <span key={idx}>📄 {p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Agent Activity History */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-primary)" />
          Agent Audit & Task History
        </h3>
        {tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.instruction}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Type: {t.task_type} • {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${t.status === 'completed' ? 'badge-status-completed' : 'badge-status-incomplete'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No AI agent tasks logged for this project yet. Use the AI Assistant to query or summarize this repository.
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"?`}
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Runner Console Modal */}
      <RunnerConsoleModal
        projectId={project.id}
        projectName={project.name}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        onStatusChange={(st) => setProject({ ...project, local_status: st as any })}
      />
    </div>
  );
};
