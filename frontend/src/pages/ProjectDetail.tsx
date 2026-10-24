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
        <Loader2 size={32} className="spin" color="var(--obs-cobalt)" />
        <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--obs-muted)' }}>
          LOADING DOSSIER SPECIFICATIONS...
        </span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="obs-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', maxWidth: '540px', margin: '3rem auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          PROJECT NOT FOUND
        </h2>
        <p style={{ color: 'var(--obs-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          The requested project record could not be found or may have been deleted.
        </p>
        <Link to="/projects" className="obs-btn obs-btn-secondary">
          <ArrowLeft size={14} /> Back to Catalog
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
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* Top Breadcrumb & Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
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
              className={`obs-btn ${isRunning ? 'obs-btn-primary' : 'obs-btn-secondary'}`}
              onClick={() => setShowConsole(true)}
              style={{
                background: isRunning ? 'var(--obs-chartreuse)' : undefined,
                color: isRunning ? '#111412' : undefined,
              }}
            >
              <Play size={14} /> {isRunning ? 'Runner Active' : 'Launch Localhost'}
            </button>
          )}

          {project.deployment_url && (
            <a
              href={project.deployment_url}
              target="_blank"
              rel="noreferrer"
              className="obs-btn obs-btn-secondary"
            >
              <ExternalLink size={13} /> Live Demo
            </a>
          )}

          {project.repository_url && (
            <a
              href={project.repository_url}
              target="_blank"
              rel="noreferrer"
              className="obs-btn obs-btn-secondary"
            >
              <GithubIcon size={13} /> GitHub
            </a>
          )}

          {project.repository_url && (
            <button
              className="obs-btn obs-btn-secondary"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              title="Re-analyze repository from GitHub"
              style={{ padding: '0.55rem' }}
            >
              <RefreshCw size={13} className={reanalyzing ? 'spin' : ''} />
            </button>
          )}

          <button
            className="obs-btn obs-btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
            title="Edit project details"
            style={{ padding: '0.55rem' }}
          >
            <Edit size={13} />
          </button>

          <button
            className="obs-btn obs-btn-secondary"
            onClick={() => setShowDeleteModal(true)}
            title="Delete project"
            style={{ padding: '0.55rem', color: 'var(--obs-error)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Project Dossier Hero */}
      <div className="obs-card" style={{ padding: '1.75rem', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Identity Glyph Tile */}
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-structural)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              fontSize: '1.3rem',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <h1 className="obs-page-title" style={{ margin: 0, fontSize: '1.75rem' }}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              {isRunning && (
                <span className="obs-tag" style={{ background: 'var(--obs-chartreuse)', color: '#111412', fontWeight: 700 }}>
                  <Radio size={11} className="pulse" /> Localhost Running
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.project_type}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Added {new Date(project.created_at).toLocaleDateString()}
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

            <p style={{ color: 'var(--obs-text)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.25rem', maxWidth: '900px' }}>
              {project.description || 'No project description documented.'}
            </p>

            {/* Tech Stack Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {project.primary_language && (
                <span className="obs-tag" style={{ background: 'var(--obs-graphite)', color: '#F5F5EE', borderColor: 'var(--obs-border)' }}>
                  LANG: {project.primary_language}
                </span>
              )}
              {project.technologies?.map((tech) => (
                <span key={tech} className="obs-tag">
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
              background: 'var(--obs-canvas)',
              border: '1px solid var(--obs-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--obs-text)' }}>
                EDIT PROJECT SPECIFICATIONS
              </div>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--obs-muted)', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--obs-muted)', marginBottom: '0.35rem' }}>
                  LIFECYCLE STATUS
                </label>
                <select
                  className="obs-input"
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
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--obs-muted)', marginBottom: '0.35rem' }}>
                  LIVE DEPLOYMENT URL
                </label>
                <input
                  type="url"
                  className="obs-input"
                  value={editDeploymentUrl}
                  onChange={(e) => setEditDeploymentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--obs-muted)', marginBottom: '0.35rem' }}>
                INTERNAL ENGINEERING NOTES & CONSTRAINTS
              </label>
              <textarea
                className="obs-input"
                style={{ height: '80px', padding: '0.65rem', resize: 'vertical' }}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Deployment milestones, environment flags, architecture constraints..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="obs-btn obs-btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="obs-btn obs-btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Save Specifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Architecture Specs, Manifests, and Deployment Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Stack & Architecture Specifications */}
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.65rem' }}>
            <Package size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              TECHNICAL ARCHITECTURE
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>Primary Language</span>
              <span style={{ fontWeight: 600, color: 'var(--obs-text)' }}>{project.primary_language || 'Not detected'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>Frontend Framework</span>
              <span style={{ fontWeight: 500 }}>{project.frontend_framework || 'None (CLI / API Only)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>Backend Framework</span>
              <span style={{ fontWeight: 500 }}>{project.backend_framework || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>Database & Storage</span>
              <span style={{ fontWeight: 500 }}>{project.database_technology || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>Local Process State</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: isRunning ? 'var(--obs-success)' : 'var(--obs-muted)' }}>
                {project.local_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Deployment & Live Preview Sandbox */}
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.65rem' }}>
            <Server size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              DEPLOYMENT & WORKSPACE SANDBOX
            </h3>
          </div>

          {project.deployment_url ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--obs-canvas)', border: '1px solid var(--obs-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                  ACTIVE PUBLIC ENDPOINT
                </div>
                <a
                  href={project.deployment_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--obs-cobalt)', fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {project.deployment_url} <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--obs-muted)', lineHeight: 1.5, margin: 0 }}>
                Live application is deployed to public production infrastructure. Click above to open.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--obs-canvas)',
                border: '1px dashed var(--obs-border)',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '38px', height: '38px', background: 'var(--obs-surface)', color: 'var(--obs-cobalt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', border: '1px solid var(--obs-border)' }}>
                <Terminal size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--obs-text)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                UNDEPLOYED WORKSPACE
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--obs-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                No active production endpoint found. Use the local daemon to clone, install dependencies, and run on localhost.
              </p>
              {project.repository_url && (
                <button
                  className="obs-btn obs-btn-secondary"
                  onClick={() => setShowConsole(true)}
                  style={{ margin: '0 auto', fontSize: '0.75rem' }}
                >
                  <Play size={12} /> Open Local Terminal Runner
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Directory Sample & File Manifests (if detected) */}
      {analysis && analysis.directory_tree_sample && analysis.directory_tree_sample.length > 0 && (
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FolderTree size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              DISCOVERED DIRECTORY STRUCTURE SAMPLE
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--obs-text)',
              background: 'var(--obs-canvas)',
              padding: '0.85rem',
              border: '1px solid var(--obs-border)',
            }}
          >
            {analysis.directory_tree_sample.map((p: string, idx: number) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={12} color="var(--obs-cobalt)" /> {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Notebooks & Documentation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
            <BookOpen size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              NOTEBOOKS & RESEARCH LINKS
            </h3>
          </div>

          {project.notebook_urls && project.notebook_urls.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    color: 'var(--obs-cobalt)',
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                    background: 'var(--obs-canvas)',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--obs-border)',
                  }}
                >
                  <BookOpen size={13} /> {nbUrl}
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--obs-muted)', fontSize: '0.8rem', margin: 0 }}>
              No Jupyter or Google Colab notebooks cataloged for this repository.
            </p>
          )}
        </div>

        {/* Engineering Notes Card */}
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.5rem' }}>
            <Code2 size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              INTERNAL NOTES & CONSTRAINTS
            </h3>
          </div>

          {project.project_notes ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--obs-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
              {project.project_notes}
            </p>
          ) : (
            <p style={{ color: 'var(--obs-muted)', fontSize: '0.8rem', margin: 0 }}>
              No engineering notes added. Click Edit above to add deployment guidelines or edge cases.
            </p>
          )}
        </div>
      </div>

      {/* README Summary */}
      {project.readme_summary && (
        <div className="obs-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <GitBranch size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              SYNTHESIZED README SUMMARY
            </h3>
          </div>
          <div
            style={{
              color: 'var(--obs-text)',
              fontSize: '0.82rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              background: 'var(--obs-canvas)',
              padding: '1rem 1.25rem',
              border: '1px solid var(--obs-border)',
            }}
          >
            {project.readme_summary}
          </div>
        </div>
      )}

      {/* AI Agent Activity Stream for this project */}
      <div className="obs-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--obs-cobalt)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
              LANGGRAPH AGENT AUDIT LOG
            </h3>
          </div>

          <Link to="/agent" className="obs-btn obs-btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}>
            <Sparkles size={12} /> Open in Agent Workspace
          </Link>
        </div>

        {tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--obs-canvas)',
                  border: '1px solid var(--obs-border)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--obs-text)', marginBottom: '0.2rem' }}>
                    {t.instruction}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
                    TYPE: {t.task_type} • {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="obs-tag" style={{ color: t.status === 'completed' ? 'var(--obs-success)' : 'var(--obs-error)' }}>
                  {t.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--obs-muted)', fontSize: '0.8rem', margin: 0 }}>
            No agent actions executed for this project yet. Use the AI Workspace to query, summarize, or mutate this project.
          </p>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project Dossier"
        message={`Are you sure you want to permanently delete "${project.name}" from your catalog and database?`}
        variant="danger"
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
