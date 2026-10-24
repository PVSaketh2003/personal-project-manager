import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { GitHubAnalysisResult, ProjectCategory, ProjectStatus } from '../types';
import { ProvenanceBadge } from '../components/StatusBadge';

export const AddProject: React.FC = () => {
  const navigate = useNavigate();

  // Workflow State: 'import' (initial minimal screen) | 'analyzing' | 'review' (review generated profile)
  const [stage, setStage] = useState<'import' | 'review'>('import');

  // Initial Import Input
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GitHubAnalysisResult | null>(null);

  // Review & Edit Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Development');
  const [projectType, setProjectType] = useState<ProjectCategory>('Web Application');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
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

  // Analyze Repository Flow
  const handleAnalyze = async (overrideUrl?: string) => {
    const target = (overrideUrl || repoUrl).trim();
    if (!target) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setDuplicateWarning(null);
    setAnalysisStep(1);

    const t1 = setTimeout(() => setAnalysisStep(2), 600);
    const t2 = setTimeout(() => setAnalysisStep(3), 1400);

    try {
      const res = await api.analyzeGitHubRepo(target);
      if (!res.success || !res.data) {
        setAnalysisError(res.error || 'Failed to extract repository details.');
        return;
      }

      const data = res.data;
      setAnalysisResult(data);

      if (res.is_duplicate) {
        setDuplicateWarning(
          'Notice: This repository URL already exists in your catalog. You can review or update specifications before saving.'
        );
      }

      // Populate review form fields
      setName(data.repository_name.value || '');
      setRepoName(data.repository_name.value || '');
      setRepoOwner(data.repository_owner.value || '');
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

      setStage('review');
    } catch (err: any) {
      setAnalysisError(err.message || 'Error communicating with analysis service.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
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
        repository_owner: repoOwner.trim() || analysisResult?.repository_owner.value || null,
        repository_name: repoName.trim() || analysisResult?.repository_name.value || null,
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
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* INITIAL REPOSITORY IMPORT SCREEN */}
      {stage === 'import' && (
        <div style={{ maxWidth: '720px', margin: '3rem auto 0' }}>
          <div className="obs-card obs-card-elevated" style={{ padding: '2.5rem' }}>
            <span className="obs-corner-mark top-right">[MODULE // REPO_INGESTION]</span>

            <div style={{ marginBottom: '1.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                }}
              >
                AUTOMATED REPOSITORY INSPECTION
              </div>

              <h1
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  marginBottom: '0.5rem',
                }}
              >
                Add a Project
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Paste a GitHub repository URL. We'll inspect the documentation and implementation to build your project profile automatically.
              </p>
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  className="form-input"
                  style={{
                    height: '48px',
                    fontSize: '0.95rem',
                    paddingLeft: '2.5rem',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  placeholder="https://github.com/username/repository-name"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  disabled={analyzing}
                  autoFocus
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <GithubIcon size={18} />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAnalyze()}
                disabled={analyzing || !repoUrl.trim()}
                style={{ height: '46px', fontSize: '0.92rem' }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Analyzing Repository Implementation...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze Repository
                  </>
                )}
              </button>
            </div>

            {/* Quick Repository Example Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                EXAMPLES:
              </span>
              {[
                { label: 'In-out-Project- (Computer Vision)', url: 'https://github.com/PVSaketh2003/In-out-Project-' },
                { label: 'FastAPI (Python Backend)', url: 'https://github.com/fastapi/fastapi' },
              ].map((ex) => (
                <button
                  key={ex.url}
                  type="button"
                  className="badge"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-structural)',
                    color: 'var(--text-secondary)',
                  }}
                  onClick={() => {
                    setRepoUrl(ex.url);
                    handleAnalyze(ex.url);
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Analysis Progress Ticker */}
            {analyzing && (
              <div
                style={{
                  padding: '1.15rem',
                  backgroundColor: 'var(--bg-surface-recessed)',
                  border: '1px solid var(--border-structural)',
                  borderRadius: '3px',
                  marginTop: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                  <Loader2 size={14} className="spin" />
                  Stage {analysisStep}/3: Repository Intelligence Ingestion
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <div style={{ color: analysisStep >= 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {analysisStep >= 1 ? '✔' : '○'} 1. Querying GitHub API metadata & git directory tree
                  </div>
                  <div style={{ color: analysisStep >= 2 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {analysisStep >= 2 ? '✔' : '○'} 2. Inspecting manifests (package.json, requirements.txt, entry files)
                  </div>
                  <div style={{ color: analysisStep >= 3 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {analysisStep >= 3 ? '✔' : '○'} 3. Synthesizing evidence-backed architecture & README summary
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {analysisError && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  borderRadius: '3px',
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
                  onClick={() => handleAnalyze()}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Manual Specification Mode Fallback */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-structural)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Need to define a private repository or manual project?
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setStage('review')}
              >
                Manual Specification Mode <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW GENERATED PROJECT PROFILE SCREEN */}
      {stage === 'review' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                REVIEW // SPECIFICATION MATRIX
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                Review Generated Profile
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Review evidence-backed parameters extracted from repository analysis before catalog persistence.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStage('import');
                  setAnalysisResult(null);
                }}
              >
                <RefreshCw size={13} /> Re-analyze Repository
              </button>
            </div>
          </div>

          {/* Analysis Evidence & Provenance Overview Ribbon */}
          {analysisResult && (
            <div
              className="obs-card"
              style={{
                marginBottom: '1.5rem',
                padding: '1.15rem 1.35rem',
                backgroundColor: 'var(--bg-surface-elevated)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Analysis Complete: {analysisResult.repository_name.value}
                </span>
                <span className="badge badge-provenance-detected">
                  {analysisResult.project_category.value}
                </span>
              </div>

              {/* Evidence References */}
              {analysisResult.evidence_references && analysisResult.evidence_references.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.65rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    EVIDENCE SOURCES:
                  </span>
                  {analysisResult.evidence_references.map((ref, idx) => (
                    <div key={idx} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      • {ref}
                    </div>
                  ))}
                </div>
              )}

              {/* Truthful Limitations / Uncertainties */}
              {analysisResult.limitations && analysisResult.limitations.length > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-structural)' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={11} /> OBSERVED IMPLEMENTATION LIMITATIONS:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                    {analysisResult.limitations.map((lim, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        - {lim}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {duplicateWarning && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
                borderRadius: '3px',
                color: 'var(--warning)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={16} /> {duplicateWarning}
            </div>
          )}

          {/* Form with 4 Organized Review Sections */}
          <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* SECTION 1: PROJECT OVERVIEW */}
            <div className="obs-card" style={{ padding: '1.5rem' }}>
              <div className="obs-card-header">
                <span className="obs-tag-index">01 // PROJECT OVERVIEW</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Project Name *</span>
                  {analysisResult?.repository_name && (
                    <ProvenanceBadge provenance={analysisResult.repository_name.provenance} source={analysisResult.repository_name.source} />
                  )}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Executive Summary / Problem Solved</span>
                  {analysisResult?.description && (
                    <ProvenanceBadge provenance={analysisResult.description.provenance} source={analysisResult.description.source} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise overview of project objectives and architecture..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Lifecycle Status</label>
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
                      <ProvenanceBadge provenance={analysisResult.project_category.provenance} source={analysisResult.project_category.source} />
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
                    <option value="Developer Tool">Developer Tool</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: TECHNICAL ARCHITECTURE */}
            <div className="obs-card" style={{ padding: '1.5rem' }}>
              <div className="obs-card-header">
                <span className="obs-tag-index">02 // TECHNICAL ARCHITECTURE</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <span>Primary Language</span>
                    {analysisResult?.primary_language && (
                      <ProvenanceBadge provenance={analysisResult.primary_language.provenance} source={analysisResult.primary_language.source} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    placeholder="e.g. Python, TypeScript"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Frontend Framework</span>
                    {analysisResult?.frontend_framework && (
                      <ProvenanceBadge provenance={analysisResult.frontend_framework.provenance} source={analysisResult.frontend_framework.source} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={frontendFramework}
                    onChange={(e) => setFrontendFramework(e.target.value)}
                    placeholder="e.g. React, Next.js, Vite"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Backend Framework</span>
                    {analysisResult?.backend_framework && (
                      <ProvenanceBadge provenance={analysisResult.backend_framework.provenance} source={analysisResult.backend_framework.source} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={backendFramework}
                    onChange={(e) => setBackendFramework(e.target.value)}
                    placeholder="e.g. FastAPI, Django, Flask"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <span>Database Engine</span>
                    {analysisResult?.database_technology && (
                      <ProvenanceBadge provenance={analysisResult.database_technology.provenance} source={analysisResult.database_technology.source} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={databaseTech}
                    onChange={(e) => setDatabaseTech(e.target.value)}
                    placeholder="e.g. PostgreSQL, SQLite"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Verified Technologies (Comma separated)</span>
                    {analysisResult?.technologies && (
                      <ProvenanceBadge provenance={analysisResult.technologies.provenance} source={analysisResult.technologies.source} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={technologiesInput}
                    onChange={(e) => setTechnologiesInput(e.target.value)}
                    placeholder="PyTorch, OpenCV, Docker, FastAPI..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: DEVELOPMENT AND DEPLOYMENT */}
            <div className="obs-card" style={{ padding: '1.5rem' }}>
              <div className="obs-card-header">
                <span className="obs-tag-index">03 // DEVELOPMENT & DEPLOYMENT</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Verified Deployment URL (Live Demo)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Optional</span>
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={deploymentUrl}
                  onChange={(e) => setDeploymentUrl(e.target.value)}
                  placeholder="https://my-project.vercel.app"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>Notebook & Colab References</span>
                  {analysisResult?.notebook_urls && (
                    <ProvenanceBadge provenance={analysisResult.notebook_urls.provenance} source={analysisResult.notebook_urls.source} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={notebookUrlsInput}
                  onChange={(e) => setNotebookUrlsInput(e.target.value)}
                  placeholder="One link per line (e.g. https://colab.research.google.com/...)"
                />
              </div>
            </div>

            {/* SECTION 4: DOCUMENTATION AND REPOSITORY */}
            <div className="obs-card" style={{ padding: '1.5rem' }}>
              <div className="obs-card-header">
                <span className="obs-tag-index">04 // DOCUMENTATION & REPOSITORY</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner</label>
                  <input
                    type="text"
                    className="form-input"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Repo Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>README Content Summary</span>
                  {analysisResult?.readme_summary && (
                    <ProvenanceBadge provenance={analysisResult.readme_summary.provenance} source={analysisResult.readme_summary.source} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={readmeSummary}
                  onChange={(e) => setReadmeSummary(e.target.value)}
                  placeholder="Synthesized setup, installation, and usage instructions..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Engineering & Edge Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Future milestones, blockers, or local runtime instructions..."
                />
              </div>
            </div>

            {/* Error Message */}
            {saveError && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  borderRadius: '3px',
                  fontSize: '0.85rem',
                }}
              >
                {saveError}
              </div>
            )}

            {/* Save Action Footer */}
            <div
              className="obs-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-surface-elevated)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStage('import')}
              >
                Back to URL Input
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ padding: '0.65rem 1.75rem' }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Persisting to PostgreSQL...
                  </>
                ) : (
                  <>
                    <FolderPlus size={16} /> Save Project to Catalog
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
