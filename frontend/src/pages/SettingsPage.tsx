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
  Lock,
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
          <span
            className="badge"
            style={{
              background: 'rgba(74, 222, 179, 0.12)',
              color: 'var(--success)',
              border: '1px solid rgba(74, 222, 179, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} /> Connected
          </span>
        );
      case 'not_configured':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(245, 197, 107, 0.12)',
              color: 'var(--warning)',
              border: '1px solid rgba(245, 197, 107, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <HelpCircle size={12} /> Not Configured
          </span>
        );
      case 'disabled':
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(160, 170, 195, 0.1)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Disabled
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(255, 113, 139, 0.12)',
              color: 'var(--danger)',
              border: '1px solid rgba(255, 113, 139, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <XCircle size={12} /> Unavailable
          </span>
        );
    }
  };

  const services = healthData?.services || {};

  const serviceList = [
    {
      key: 'fastapi',
      name: 'FastAPI Backend Engine',
      category: 'Core Service',
      icon: Server,
      iconColor: 'var(--accent-secondary)',
      description: 'Python 3.13 ASGI server managing async REST endpoints and task dispatches.',
      details: services.fastapi?.details,
      status: services.fastapi?.status || 'connected',
    },
    {
      key: 'postgresql',
      name: 'PostgreSQL Relational DB',
      category: 'Persistence',
      icon: Database,
      iconColor: '#38bdf8',
      description: 'Primary transactional storage with Alembic schema migrations.',
      details: services.postgresql?.details,
      status: services.postgresql?.status || 'unavailable',
    },
    {
      key: 'chromadb',
      name: 'ChromaDB Vector Store',
      category: 'Semantic Retrieval',
      icon: Layers,
      iconColor: 'var(--accent-primary)',
      description: 'Persistent local vector database for semantic repository search and retrieval.',
      details: services.chromadb?.details,
      status: services.chromadb?.status || 'unavailable',
    },
    {
      key: 'github',
      name: 'GitHub REST API Integration',
      category: 'Repository Ingestion',
      icon: GithubIcon,
      iconColor: 'var(--text-primary)',
      description: 'Queries public repository trees, parses manifest dependencies, and extracts READMEs.',
      details: services.github?.details,
      status: services.github?.status || 'not_configured',
    },
    {
      key: 'langgraph',
      name: 'LangGraph Stateful Workflow',
      category: 'Agent Orchestration',
      icon: ShieldCheck,
      iconColor: 'var(--success)',
      description: 'Multi-node state graph orchestrating intent classification, retrieval, and safety approvals.',
      details: services.langgraph?.details,
      status: services.langgraph?.status || 'connected',
    },
    {
      key: 'langchain_model',
      name: 'LangChain LLM Integration',
      category: 'Language Intelligence',
      icon: Activity,
      iconColor: 'var(--warning)',
      description: 'Language model invocation layer with automatic fallback to local deterministic rules.',
      details: services.langchain_model?.details,
      status: services.langchain_model?.status || 'not_configured',
    },
    {
      key: 'langsmith',
      name: 'LangSmith Tracing Observability',
      category: 'Telemetry',
      icon: Eye,
      iconColor: 'var(--accent-highlight)',
      description: 'End-to-end execution trace monitoring with automatic token redaction.',
      details: services.langsmith?.details,
      status: services.langsmith?.status || 'disabled',
    },
  ];

  const connectedCount = serviceList.filter((s) => s.status === 'connected').length;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(74, 222, 179, 0.12)', border: '1px solid rgba(74, 222, 179, 0.28)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            <Activity size={12} /> SYSTEM DIAGNOSTICS & TELEMETRY
          </div>
          <h1 className="page-title">Settings & Infrastructure</h1>
          <p className="page-subtitle">
            Live operational status across database engines, vector indices, agent graphs, and security boundaries.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Diagnostics
        </button>
      </div>

      {/* Top Health Summary Metric Bar */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          marginBottom: '2rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            TOTAL MONITORED
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {serviceList.length} Services
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            ONLINE & CONNECTED
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
            {connectedCount} Active
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            FALLBACK ROUTING
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
            Operational
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            CREDENTIAL ISOLATION
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-highlight)' }}>
            Backend Enforced
          </div>
        </div>
      </div>

      {/* Services Health List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
        {serviceList.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.key}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '1rem',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flex: 1, minWidth: '260px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: service.iconColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {service.name}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {service.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
                    {service.description}
                  </p>
                  {service.details && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Diagnostic: {service.details}
                    </div>
                  )}
                </div>
              </div>

              <div>{getStatusBadge(service.status as any)}</div>
            </div>
          );
        })}
      </div>

      {/* Security & Isolation Boundaries Card */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <Lock size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Security Architecture & Secret Isolation</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          All credentials, personal access tokens, database connections, and telemetry keys are confined to the backend server process. The browser never receives unmasked keys, preventing accidental credential exposure across client sessions or git commits.
        </p>

        <div
          style={{
            background: 'var(--bg-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}># Target Backend Configuration Pattern (backend/.env):</span><br />
          <span style={{ color: 'var(--accent-secondary)' }}>DATABASE_URL</span>=postgresql+asyncpg://user@localhost:5432/project_manager<br />
          <span style={{ color: 'var(--accent-secondary)' }}>GITHUB_TOKEN</span>=ghp_************************************<br />
          <span style={{ color: 'var(--accent-secondary)' }}>CHROMA_PERSIST_DIRECTORY</span>=./chroma_data<br />
          <span style={{ color: 'var(--accent-secondary)' }}>LANGSMITH_TRACING</span>=false<br />
          <span style={{ color: 'var(--accent-secondary)' }}>LOCAL_PROJECTS_DIR</span>=/Users/pvsairamsaketh/Documents/projects_local
        </div>
      </div>
    </div>
  );
};
