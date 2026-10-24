import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Eye,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { ComponentHealth, SettingsHealthResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<SettingsHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getSettingsHealth();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to load settings health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (status: ComponentHealth['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="badge badge-status-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Connected
          </span>
        );
      case 'not_configured':
        return (
          <span className="badge badge-status-incomplete" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} /> Not Configured
          </span>
        );
      case 'disabled':
        return (
          <span className="badge badge-status-archived" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Disabled
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> Unavailable
          </span>
        );
    }
  };

  const services = healthData?.services || {};

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Health & Observability</h1>
          <p className="page-subtitle">
            Live infrastructure diagnostics for FastAPI, PostgreSQL, ChromaDB, LangGraph, and LangSmith.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Status
        </button>
      </div>

      {/* Services Diagnostics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {/* FastAPI Backend */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Server size={24} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>FastAPI Backend Engine</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.fastapi?.details || 'Python 3.13 ASGI server on macOS'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.fastapi?.status || 'connected')}
        </div>

        {/* PostgreSQL */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Database size={24} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>PostgreSQL Database</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.postgresql?.details || 'Primary source of truth with Alembic schema migrations'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.postgresql?.status || 'unavailable')}
        </div>

        {/* ChromaDB */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Layers size={24} color="#a855f7" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>ChromaDB Vector Store</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.chromadb?.details || 'Semantic search and document embeddings'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.chromadb?.status || 'unavailable')}
        </div>

        {/* GitHub Integration */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <GithubIcon size={24} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>GitHub REST API Integration</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.github?.details || 'Extracts repo trees, manifests, and README summaries'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.github?.status || 'not_configured')}
        </div>

        {/* LangGraph Agent */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={24} color="#10b981" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>LangGraph Stateful Agent</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.langgraph?.details || 'StateGraph workflow with deterministic fallback'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.langgraph?.status || 'connected')}
        </div>

        {/* LangChain Model */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={24} color="#f59e0b" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>LangChain LLM Integration</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.langchain_model?.details || 'Rule-based deterministic engine active'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.langchain_model?.status || 'not_configured')}
        </div>

        {/* LangSmith Observability */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Eye size={24} color="#ec4899" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>LangSmith Tracing Observability</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {services.langsmith?.details || 'Optional agent tracing with secret redaction'}
              </p>
            </div>
          </div>
          {getStatusBadge(services.langsmith?.status || 'disabled')}
        </div>
      </div>

      {/* Security & Configuration Guide Card */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Security & Environment Isolation
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          All credentials (GitHub tokens, LangSmith API keys, Database URLs) are read strictly from backend environment variables (<code>.env</code>) and are <strong>never</strong> transmitted to the browser or stored in repository commits.
        </p>
        <div
          style={{
            background: 'var(--bg-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          # Example backend/.env configuration:<br />
          DATABASE_URL=postgresql+asyncpg://user@localhost:5432/project_manager<br />
          GITHUB_TOKEN=ghp_your_secure_personal_token<br />
          LANGSMITH_TRACING=false<br />
          LANGSMITH_API_KEY=lsv2_pt_your_langsmith_key<br />
          LOCAL_PROJECTS_DIR=/Users/pvsairamsaketh/Documents/projects_local
        </div>
      </div>
    </div>
  );
};
