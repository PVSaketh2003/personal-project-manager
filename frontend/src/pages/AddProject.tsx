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
  GitBranch,
  Layers,
  FileCode2,
  Globe,
  Sliders,
  PenTool,
  Check,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { GitHubAnalysisResult, ProjectCategory, ProjectStatus } from '../types';
import { ProvenanceBadge } from '../components/StatusBadge';

export const AddProject: React.FC = () => {
  const navigate = useNavigate();

  // Stage Management: 1 = Repository Ingestion, 2 = Review & Confirm
  const [activeStage, setActiveStage] = useState<1 | 2>(1);

  // Stage 1 Input
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GitHubAnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  // Form Fields (Stage 2)
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

  // Simulated analysis progression steps for better user feedback
  const triggerAnalysisStepProgression = () => {
    setAnalysisStep(1);
    const t1 = setTimeout(() => setAnalysisStep(2), 600);
    const t2 = setTimeout(() => setAnalysisStep(3), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  // Trigger Automatic Repository Analysis
  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || repoUrl).trim();
    if (!targetUrl) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setDuplicateWarning(null);
    triggerAnalysisStepProgression();

    try {
      const res = await api.analyzeGitHubRepo(targetUrl);
      if (!res.success || !res.data) {
        setAnalysisError(res.error || 'Failed to extract repository details.');
        return;
      }

      const data = res.data;
      setAnalysisResult(data);

      if (res.is_duplicate) {
        setDuplicateWarning(
          'Notice: This repository URL already exists in your catalog. You can still review or edit before saving.'
        );
      }

      // Auto-populate editable form fields
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

      // Seamlessly advance to stage 2
      setActiveStage(2);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error communicating with analysis service.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkipToManual = () => {
    setActiveStage(2);
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

  // Provenance counts
  const provenanceStats = analysisResult
    ? Object.values(analysisResult).reduce(
        (acc: { detected: number; inferred: number; needs_review: number }, val: any) => {
          if (val && typeof val === 'object' && val.provenance) {
            if (val.provenance === 'detected') acc.detected++;
            else if (val.provenance === 'inferred') acc.inferred++;
            else if (val.provenance === 'needs_review') acc.needs_review++;
          }
          return acc;
        },
        { detected: 0, inferred: 0, needs_review: 0 }
      )
    : null;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(139, 124, 255, 0.12)', border: '1px solid rgba(139, 124, 255, 0.28)', color: 'var(--accent-highlight)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Sparkles size={12} /> REPOSITORY INTELLIGENCE PIPELINE
          </div>
          <h1 className="page-title">Add New Project</h1>
          <p className="page-subtitle">
            Ingest source repositories with automatic AST manifest extraction, or define manual project specifications.
          </p>
        </div>
      </div>

      {/* Two-Stage Progress Stepper */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveStage(1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            background: activeStage === 1 ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
            border: activeStage === 1 ? '1px solid var(--accent-secondary)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: activeStage === 1 ? 'var(--shadow-glow-cyan)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: activeStage === 1 ? 'var(--accent-secondary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeStage === 1 ? '#0B1020' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.88rem',
              flexShrink: 0,
            }}
          >
            {analysisResult ? <Check size={16} /> : '1'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: activeStage === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Stage 1: Repository Ingestion
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {analysisResult ? 'Repository analyzed successfully' : 'Analyze manifests & file trees'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage(2)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            background: activeStage === 2 ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
            border: activeStage === 2 ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: activeStage === 2 ? 'var(--shadow-glow-violet)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: activeStage === 2 ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeStage === 2 ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.88rem',
              flexShrink: 0,
            }}
          >
            2
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: activeStage === 2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Stage 2: Review Specifications
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Grouped fields with provenance metadata
            </div>
          </div>
        </button>
      </div>

      {/* STAGE ONE: FOCUSED REPOSITORY IMPORT CENTERPIECE */}
      {activeStage === 1 && (
        <div
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(72, 221, 245, 0.35)',
            boxShadow: '0 8px 32px rgba(11, 16, 32, 0.6), 0 0 24px rgba(72, 221, 245, 0.1)',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              right: '-10%',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(72, 221, 245, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(72, 221, 245, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
              }}
            >
              <GithubIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                GitHub Repository Ingestion
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Directly query GitHub REST API, inspect manifest files, and synthesize project metadata.
              </span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: '1rem 0 1.5rem' }}>
            Enter any public GitHub repository. The engine extracts the repository structure, scans dependency trees (<code>package.json</code>, <code>requirements.txt</code>, <code>pyproject.toml</code>), infers deployment targets, and summarizes the README.
          </p>

          {/* URL Input Form */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <input
                type="url"
                className="form-input"
                style={{
                  paddingLeft: '2.5rem',
                  fontSize: '0.95rem',
                  borderColor: analyzing ? 'var(--accent-secondary)' : undefined,
                }}
                placeholder="https://github.com/PVSaketh2003/In-out-Project-"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
                disabled={analyzing}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                <GitBranch size={16} />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleAnalyze()}
              disabled={analyzing || !repoUrl.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.92rem',
                minWidth: '180px',
              }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Analyzing Pipeline...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze Repository
                </>
              )}
            </button>
          </div>

          {/* Suggested Quick Repositories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Examples:</span>
            {[
              { label: 'In-out-Project (Computer Vision)', url: 'https://github.com/PVSaketh2003/In-out-Project-' },
              { label: 'FastAPI (Python Backend)', url: 'https://github.com/fastapi/fastapi' },
            ].map((ex) => (
              <button
                key={ex.url}
                type="button"
                className="badge"
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
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

          {/* Live Progress Ticker when Analyzing */}
          {analyzing && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                background: 'rgba(72, 221, 245, 0.05)',
                border: '1px solid rgba(72, 221, 245, 0.25)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                <Loader2 size={15} className="spin" />
                Pipeline Ingestion in Progress:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: analysisStep >= 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={13} /> 1. Querying GitHub REST endpoint for repository metadata & tree
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: analysisStep >= 2 ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={13} /> 2. Parsing dependency manifests (package.json, requirements.txt, pyproject.toml)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: analysisStep >= 3 ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={13} /> 3. Classifying architecture stack, framework tiers, and README summaries
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                background: 'rgba(245, 197, 107, 0.1)',
                border: '1px solid rgba(245, 197, 107, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--warning)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
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
                padding: '0.85rem 1rem',
                background: 'rgba(255, 113, 139, 0.1)',
                border: '1px solid rgba(255, 113, 139, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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

          {/* Manual Entry Fallback Link */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Don't have a public GitHub repo or prefer manual entry?
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSkipToManual}
            >
              Manual Specification Mode <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* STAGE TWO: STRUCTURED SPECIFICATION FORM */}
      {activeStage === 2 && (
        <div>
          {/* Analysis Summary Ribbon (if analyzed) */}
          {analysisResult && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Metadata Extracted: {analysisResult.repository_name.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.65rem' }}>
                    {provenanceStats && (
                      <>
                        <span style={{ color: 'var(--accent-secondary)' }}>• {provenanceStats.detected} Detected</span>
                        <span style={{ color: 'var(--accent-highlight)' }}>• {provenanceStats.inferred} Inferred</span>
                        <span style={{ color: 'var(--warning)' }}>• {provenanceStats.needs_review} Needs Review</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveStage(1)}
                >
                  <RefreshCw size={13} /> Re-analyze URL
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* GROUP 1: PROJECT OVERVIEW */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Layers size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>1. Project Overview</h3>
              </div>

              {/* Name */}
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
                  <span>Executive Description</span>
                  {analysisResult?.description && (
                    <ProvenanceBadge provenance={analysisResult.description.provenance} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="High-level engineering overview of what this project does and key capabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* Status and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Development Lifecycle Status</label>
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
            </div>

            {/* GROUP 2: REPOSITORY INFORMATION */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <GithubIcon size={18} color="var(--accent-secondary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>2. Repository Information</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">GitHub Repository URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/..."
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Owner / Org</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PVSaketh2003"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Repo Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="In-out-Project-"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>Primary Programming Language</span>
                  {analysisResult?.primary_language && (
                    <ProvenanceBadge provenance={analysisResult.primary_language.provenance} />
                  )}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Python, TypeScript, Rust, Go"
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                />
              </div>
            </div>

            {/* GROUP 3: TECHNOLOGY STACK */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Sliders size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>3. Technology Stack & Database</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <span>Database Engine</span>
                    {analysisResult?.database_technology && (
                      <ProvenanceBadge provenance={analysisResult.database_technology.provenance} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. PostgreSQL, SQLite, ChromaDB"
                    value={databaseTech}
                    onChange={(e) => setDatabaseTech(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Technologies & Libraries (Comma separated)</span>
                    {analysisResult?.technologies && (
                      <ProvenanceBadge provenance={analysisResult.technologies.provenance} />
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PyTorch, OpenCV, Docker, FastAPI, Celery, React..."
                    value={technologiesInput}
                    onChange={(e) => setTechnologiesInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* GROUP 4: FRONTEND AND BACKEND ARCHITECTURE */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <FileCode2 size={18} color="var(--accent-secondary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>4. Frontend and Backend Tiers</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    placeholder="e.g. React, Next.js, Vite, Streamlit, None"
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
                    placeholder="e.g. FastAPI, Django, Flask, Express, None"
                    value={backendFramework}
                    onChange={(e) => setBackendFramework(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* GROUP 5: DEPLOYMENT AND NOTEBOOKS */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Globe size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>5. Deployment & Notebooks</h3>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Live Deployment URL</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo / Production</span>
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://my-app.vercel.app or https://portfolio.domain.com"
                  value={deploymentUrl}
                  onChange={(e) => setDeploymentUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>Interactive Notebook Links (Google Colab / Kaggle / Jupyter)</span>
                  {analysisResult?.notebook_urls && (
                    <ProvenanceBadge provenance={analysisResult.notebook_urls.provenance} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '65px' }}
                  placeholder="One link per line (e.g. https://colab.research.google.com/drive/...)"
                  value={notebookUrlsInput}
                  onChange={(e) => setNotebookUrlsInput(e.target.value)}
                />
              </div>
            </div>

            {/* GROUP 6: NOTES AND METADATA */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <PenTool size={18} color="var(--accent-highlight)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>6. README Content & Internal Notes</h3>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Synthesized README Summary</span>
                  {analysisResult?.readme_summary && (
                    <ProvenanceBadge provenance={analysisResult.readme_summary.provenance} />
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Extracted key setup and usage instructions from repository README..."
                  value={readmeSummary}
                  onChange={(e) => setReadmeSummary(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Engineering & Edge Deployment Notes</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '65px' }}
                  placeholder="Future milestones, blockers, or local runtime instructions..."
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {saveError && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 113, 139, 0.1)',
                  border: '1px solid rgba(255, 113, 139, 0.3)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} /> {saveError}
              </div>
            )}

            {/* Sticky/Prominent Action Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '1rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStage(1)}
                >
                  Back to Repo Input
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.75rem',
                    boxShadow: 'var(--shadow-glow-violet)',
                  }}
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
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
