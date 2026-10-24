import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Code2,
  ExternalLink,
  FolderTree,
  GitBranch,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Server,
  Sparkles,
  Terminal,
  Trash2,
  Edit,
  X,
  Radio,
  FileCode,
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

  // Edit fields
  const [editStatus, setEditStatus] = useState<ProjectStatus>('In Development');
  const [editDeploymentUrl, setEditDeploymentUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadProjectData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await api.getProject(id);
      setProject(p);
      setEditStatus(p.status);
      setEditDeploymentUrl(p.deployment_url || '');
      setEditNotes(p.project_notes || '');

      // Load agent tasks associated with this project
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
    setSavingEdit(true);
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
    } finally {
      setSavingEdit(false);
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
        <Loader2 size={36} className="spin" color="var(--accent-primary)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading project specifications...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', maxWidth: '540px', margin: '3rem auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Project Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          The requested project record could not be found or may have been deleted.
        </p>
        <Link to="/projects" className="btn btn-secondary">
          <ArrowLeft size={15} /> Back to All Projects
        </Link>
      </div>
    );
  }

  const analysis = project.repository_analysis_metadata;
  const initials = project.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isRunning = project.local_status === 'running';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Breadcrumb & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Link to="/projects" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Projects
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.name}</span>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {project.repository_url && (
            <button
              className="btn btn-primary"
              onClick={() => setShowConsole(true)}
              style={{
                boxShadow: isRunning ? 'var(--shadow-glow-cyan)' : 'none',
                background: isRunning ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
              }}
            >
              <Play size={15} /> {isRunning ? 'Runner Active' : 'Launch Localhost'}
            </button>
          )}

          {project.deployment_url && (
            <a
              href={project.deployment_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={14} /> Live Demo
            </a>
          )}

          {project.repository_url && (
            <a
              href={project.repository_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <GithubIcon size={14} /> GitHub
            </a>
          )}

          {project.repository_url && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              title="Re-analyze repository from GitHub"
            >
              <RefreshCw size={14} className={reanalyzing ? 'spin' : ''} />
            </button>
          )}

          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setIsEditing(!isEditing)}
            title="Edit project details"
          >
            <Edit size={14} />
          </button>

          <button
            className="btn btn-danger btn-icon"
            onClick={() => setShowDeleteModal(true)}
            title="Delete project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Developer Profile Hero Card */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Subtle Ambient Aurora Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139, 124, 255, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Monogram / Geometric Tile */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(139, 124, 255, 0.25) 0%, rgba(72, 221, 245, 0.25) 100%)',
              border: '1px solid rgba(139, 124, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.35rem',
              color: 'var(--accent-secondary)',
              flexShrink: 0,
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              {isRunning && (
                <span className="badge" style={{ background: 'rgba(74, 222, 179, 0.15)', color: 'var(--success)', border: '1px solid rgba(74, 222, 179, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Radio size={11} className="pulse" /> Localhost Running
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ color: 'var(--accent-highlight)', fontWeight: 600 }}>{project.project_type}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Ingested {new Date(project.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Updated {new Date(project.updated_at).toLocaleDateString()}
              </span>
              {project.repository_owner && (
                <>
                  <span>•</span>
                  <span>Owner: {project.repository_owner}</span>
                </>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
              {project.description || 'No project description documented.'}
            </p>

            {/* Tech Stack Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {project.primary_language && (
                <span className="badge" style={{ background: 'rgba(139, 124, 255, 0.15)', color: 'var(--accent-highlight)', border: '1px solid rgba(139, 124, 255, 0.3)' }}>
                  {project.primary_language}
                </span>
              )}
              {project.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="badge"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Edit Drawer */}
        {isEditing && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Edit Project Specifications
              </h3>
              <button onClick={() => setIsEditing(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Lifecycle Status</label>
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
              <label className="form-label">Internal Engineering & Edge Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Future milestones, deployment instructions, environment configs..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Architecture Specs, Manifests, and Deployment Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Card 1: Architecture & Frameworks */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Package size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Stack & Architecture</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Language</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.primary_language || 'Not detected'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frontend Framework</span>
              <span style={{ fontWeight: 500 }}>{project.frontend_framework || 'None (CLI / Backend)'}</span>
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
              <span style={{ color: 'var(--text-muted)' }}>Local Process State</span>
              <span style={{ fontWeight: 600, color: isRunning ? 'var(--success)' : 'var(--text-secondary)' }}>
                {project.local_status}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Deployment & Live Preview Sandbox */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Server size={18} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Deployment & Sandbox</h3>
          </div>

          {project.deployment_url ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>LIVE URL</div>
                <a
                  href={project.deployment_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {project.deployment_url} <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Production demo is hosted externally. Click the link above to view the active web application.
              </p>
            </div>
          ) : (
            /* Undeployed Project Sandbox */
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 124, 255, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <Terminal size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Undeployed Repository Workspace
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                This project has no public URL. You can launch the local runner daemon to clone, install dependencies, and run it on localhost.
              </p>
              {project.repository_url && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowConsole(true)}
                  style={{ margin: '0 auto' }}
                >
                  <Play size={13} /> Open Local Runner Terminal
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Directory Sample & File Manifests (if detected) */}
      {analysis && analysis.directory_tree_sample && analysis.directory_tree_sample.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FolderTree size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Detected Project Structure Sample</h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {analysis.directory_tree_sample.map((p: string, idx: number) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={13} color="var(--accent-secondary)" /> {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Notebooks & Documentation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BookOpen size={18} color="var(--accent-highlight)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Notebooks & Research Links</h3>
          </div>

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
                    color: 'var(--accent-secondary)',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                    background: 'var(--bg-secondary)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <BookOpen size={14} /> {nbUrl}
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No Jupyter or Google Colab notebooks cataloged for this repository.
            </p>
          )}
        </div>

        {/* Engineering Notes Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Code2 size={18} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Internal Engineering Notes</h3>
          </div>

          {project.project_notes ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {project.project_notes}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No engineering notes added. Click Edit above to add deployment guidelines or milestones.
            </p>
          )}
        </div>
      </div>

      {/* README Summary */}
      {project.readme_summary && (
        <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <GitBranch size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Synthesized README Summary</h3>
          </div>
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {project.readme_summary}
          </div>
        </div>
      )}

      {/* AI Agent Activity Stream for this project */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>LangGraph Agent Activity</h3>
          </div>

          <Link to="/agent" className="btn btn-secondary btn-sm">
            <Sparkles size={13} /> Open in Agent Command Center
          </Link>
        </div>

        {tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {t.instruction}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Type: <code style={{ color: 'var(--accent-secondary)' }}>{t.task_type}</code> • {new Date(t.created_at).toLocaleString()}
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
            No agent actions executed for this project yet. Use the AI Assistant to query, summarize, or mutate this project.
          </p>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}" from your catalog and database?`}
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

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
