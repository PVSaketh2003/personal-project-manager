import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { GitHubAnalysisResult, ProjectCategory, ProjectStatus } from '../types';
import { ProvenanceBadge } from '../components/StatusBadge';

export const AddProject: React.FC = () => {
  const navigate = useNavigate();

  // Primary URL input
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GitHubAnalysisResult | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Development');
  const [projectType, setProjectType] = useState<ProjectCategory>('Web Application');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [frontendFramework, setFrontendFramework] = useState('');
  const [backendFramework, setBackendFramework] = useState('');
  const [databaseTech, setDatabaseTech] = useState('');
  const [technologiesInput, setTechnologiesInput] = useState('');
  const [readmeSummary, setReadmeSummary] = useState('');
  const [notebookUrlsInput, setNotebookUrlsInput] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Trigger Automatic Repository Analysis
  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setDuplicateWarning(null);

    try {
      const res = await api.analyzeGitHubRepo(repoUrl.trim());
      if (!res.success || !res.data) {
        setAnalysisError(res.error || 'Failed to extract repository details.');
        return;
      }

      const data = res.data;
      setAnalysisResult(data);

      if (res.is_duplicate) {
        setDuplicateWarning(
          'Notice: This repository URL already exists in your catalog. You can still review or edit before proceeding.'
        );
      }

      // Auto-populate editable form fields
      setName(data.repository_name.value || '');
      setDescription(data.description.value || '');
      setProjectType(data.project_category.value || 'Web Application');
      setPrimaryLanguage(data.primary_language.value || '');
      setFrontendFramework(data.frontend_framework.value || '');
      setBackendFramework(data.backend_framework.value || '');
      setDatabaseTech(data.database_technology.value || '');
      setTechnologiesInput((data.technologies.value || []).join(', '));
      setReadmeSummary(data.readme_summary.value || '');
      setNotebookUrlsInput((data.notebook_urls.value || []).join('\n'));

      if (data.homepage) {
        setDeploymentUrl(data.homepage);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error communicating with analysis service.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Project name is required.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const techList = technologiesInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const notebookList = notebookUrlsInput
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const created = await api.createProject({
        name: name.trim(),
        description: description.trim(),
        repository_url: repoUrl.trim() || null,
        repository_owner: analysisResult?.repository_owner.value || null,
        repository_name: analysisResult?.repository_name.value || null,
        deployment_url: deploymentUrl.trim() || null,
        status,
        project_type: projectType,
        primary_language: primaryLanguage.trim() || null,
        frontend_framework: frontendFramework.trim() || null,
        backend_framework: backendFramework.trim() || null,
        database_technology: databaseTech.trim() || null,
        technologies: techList,
        readme_summary: readmeSummary.trim() || null,
        notebook_urls: notebookList,
        project_notes: projectNotes.trim() || null,
        repository_analysis_metadata: analysisResult ? analysisResult : null,
        analysis_timestamp: analysisResult ? new Date().toISOString() : null,
      });

      navigate(`/projects/${created.id}`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Project</h1>
          <p className="page-subtitle">
            Paste a GitHub URL to auto-extract repository metadata, or enter details manually.
          </p>
        </div>
      </div>

      {/* GitHub Repository Extraction Card */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          border: '1px solid var(--accent-subtle)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <GithubIcon size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Automated GitHub Repository Extraction
          </h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Our backend analyzer queries the GitHub API, parses dependency manifests (<code>package.json</code>, <code>requirements.txt</code>), classifies frameworks, and generates README summaries.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '280px' }}
            placeholder="https://github.com/PVSaketh2003/In-out-Project-"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={analyzing}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={analyzing || !repoUrl.trim()}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="spin" />
                Analyzing Repository...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze Repository
              </>
            )}
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--warning)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} /> {duplicateWarning}
          </div>
        )}

        {/* Analysis Error */}
        {analysisError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {analysisError}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAnalyze}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Provenance success notification */}
        {analysisResult && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--success)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={16} /> Repository analyzed! Fields have been auto-populated with confidence and provenance below.
          </div>
        )}
      </div>

      {/* Main Project Form */}
      <form onSubmit={handleSaveProject} className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Project Specifications
        </h2>

        {/* Project Name */}
        <div className="form-group">
          <label className="form-label">
            <span>Project Name *</span>
            {analysisResult?.repository_name && (
              <ProvenanceBadge provenance={analysisResult.repository_name.provenance} />
            )}
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. In-Out Analytics System"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">
            <span>Description</span>
            {analysisResult?.description && (
              <ProvenanceBadge provenance={analysisResult.description.provenance} />
            )}
          </label>
          <textarea
            className="form-textarea"
            placeholder="Concise summary of what this project does and what problems it solves..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Two Columns: Status & Project Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Project Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="In Development">In Development</option>
              <option value="Completed">Completed</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Planning">Planning</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Project Category</span>
              {analysisResult?.project_category && (
                <ProvenanceBadge provenance={analysisResult.project_category.provenance} />
              )}
            </label>
            <select
              className="form-select"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectCategory)}
            >
              <option value="Web Application">Web Application</option>
              <option value="Machine Learning / Edge AI">Machine Learning / Edge AI</option>
              <option value="Data Science & Analytics">Data Science & Analytics</option>
              <option value="Backend API">Backend API</option>
              <option value="Jupyter Notebook">Jupyter Notebook</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Deployment URL */}
        <div className="form-group">
          <label className="form-label">
            <span>Deployment URL (Live Demo)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optional</span>
          </label>
          <input
            type="url"
            className="form-input"
            placeholder="https://my-app.vercel.app or https://portfolio.domain.com"
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
          />
        </div>

        {/* Frameworks row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">
              <span>Primary Language</span>
              {analysisResult?.primary_language && (
                <ProvenanceBadge provenance={analysisResult.primary_language.provenance} />
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Python, TypeScript"
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Frontend Framework</span>
              {analysisResult?.frontend_framework && (
                <ProvenanceBadge provenance={analysisResult.frontend_framework.provenance} />
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React, Next.js, Vite"
              value={frontendFramework}
              onChange={(e) => setFrontendFramework(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Backend Framework</span>
              {analysisResult?.backend_framework && (
                <ProvenanceBadge provenance={analysisResult.backend_framework.provenance} />
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. FastAPI, Django, Flask"
              value={backendFramework}
              onChange={(e) => setBackendFramework(e.target.value)}
            />
          </div>
        </div>

        {/* Database & Technologies */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">
              <span>Database Tech</span>
              {analysisResult?.database_technology && (
                <ProvenanceBadge provenance={analysisResult.database_technology.provenance} />
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PostgreSQL, SQLite"
              value={databaseTech}
              onChange={(e) => setDatabaseTech(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Technologies (Comma Separated)</span>
              {analysisResult?.technologies && (
                <ProvenanceBadge provenance={analysisResult.technologies.provenance} />
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="PyTorch, OpenCV, Docker, Celery..."
              value={technologiesInput}
              onChange={(e) => setTechnologiesInput(e.target.value)}
            />
          </div>
        </div>

        {/* Notebook URLs */}
        <div className="form-group">
          <label className="form-label">
            <span>Notebook URLs (Google Colab / Jupyter)</span>
            {analysisResult?.notebook_urls && (
              <ProvenanceBadge provenance={analysisResult.notebook_urls.provenance} />
            )}
          </label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '60px' }}
            placeholder="One link per line (e.g. https://colab.research.google.com/...)"
            value={notebookUrlsInput}
            onChange={(e) => setNotebookUrlsInput(e.target.value)}
          />
        </div>

        {/* README Summary */}
        <div className="form-group">
          <label className="form-label">
            <span>README Content Summary</span>
            {analysisResult?.readme_summary && (
              <ProvenanceBadge provenance={analysisResult.readme_summary.provenance} />
            )}
          </label>
          <textarea
            className="form-textarea"
            placeholder="Extracted key setup and usage instructions from repository README..."
            value={readmeSummary}
            onChange={(e) => setReadmeSummary(e.target.value)}
          />
        </div>

        {/* Project Notes */}
        <div className="form-group">
          <label className="form-label">Internal Engineering Notes</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '60px' }}
            placeholder="Future milestones, blockers, or edge deployment instructions..."
            value={projectNotes}
            onChange={(e) => setProjectNotes(e.target.value)}
          />
        </div>

        {/* Save Error */}
        {saveError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spin" /> Saving Project...
              </>
            ) : (
              <>
                <FolderPlus size={16} /> Confirm & Save to Database
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
