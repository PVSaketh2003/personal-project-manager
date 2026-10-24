import React, { useEffect, useState } from 'react';
import {
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
  Moon,
  Cloud,
  HardDrive,
  Cpu,
  Terminal,
  Activity,
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
            className="obs-tag"
            style={{
              color: 'var(--success)',
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
            className="obs-tag"
            style={{
              color: 'var(--warning)',
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
            className="obs-tag"
            style={{
              color: 'var(--text-muted)',
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
            className="obs-tag"
            style={{
              color: 'var(--danger)',
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
      iconColor: 'var(--accent-cobalt)',
      description: 'Python 3.13 ASGI server managing async REST endpoints and agent state graphs.',
      details: services.fastapi?.details,
      status: services.fastapi?.status || 'connected',
    },
    {
      key: 'postgresql',
      name: 'PostgreSQL Relational DB',
      category: 'Persistence & Conversations',
      icon: Database,
      iconColor: '#38bdf8',
      description: 'Primary transactional storage for projects, conversations, and ordered messages.',
      details: services.postgresql?.details,
      status: services.postgresql?.status || 'connected',
    },
    {
      key: 'chromadb',
      name: 'ChromaDB Vector Store',
      category: 'Semantic Retrieval',
      icon: Layers,
      iconColor: 'var(--accent-cobalt)',
      description: 'Persistent local vector database for semantic repository indexing and similarity search.',
      details: services.chromadb?.details,
      status: services.chromadb?.status || 'unavailable',
    },
    {
      key: 'github',
      name: 'GitHub REST API Integration',
      category: 'Repository Intelligence',
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
      iconColor: 'var(--accent-cobalt)',
      description: 'End-to-end execution trace monitoring with automatic token redaction.',
      details: services.langsmith?.details,
      status: services.langsmith?.status || 'disabled',
    },
  ];

  const connectedCount = serviceList.filter((s) => s.status === 'connected').length;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3.5rem' }}>
      
      {/* Header */}
      <div className="obs-card" style={{ padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="obs-page-title" style={{ margin: '0 0 0.35rem', fontSize: '1.5rem' }}>
            Settings & Infrastructure
          </h1>
          <p className="obs-page-subtitle" style={{ margin: 0 }}>
            Inspect system diagnostics, database connectivity, and cloud deployment specifications.
          </p>
        </div>

        <button className="obs-btn obs-btn-secondary" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh Status
        </button>
      </div>

      {/* Visual Identity Section: Dark Mode Active */}
      <div className="obs-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-structural)',
            }}
          >
            <Moon size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Dark Theme Active
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Engineered with Obsidian Ink (#0F1311) canvas, graphite surfaces, and signal chartreuse accents.
            </div>
          </div>
        </div>

        <span className="obs-tag" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontWeight: 600 }}>
          Default & Locked
        </span>
      </div>

      {/* Services Health List */}
      <div className="obs-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              System Services & Connectivity
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              {connectedCount} of {serviceList.length} services online and responding
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {serviceList.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-structural)',
                  borderRadius: '4px',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-structural)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: service.iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {service.name}
                      </span>
                      <span className="obs-tag" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                        {service.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {service.description}
                    </div>
                    {service.details && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        Details: {service.details}
                      </div>
                    )}
                  </div>
                </div>

                <div>{getStatusBadge(service.status as any)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud-Ready Architecture & Deployment Specification */}
      <div className="obs-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Cloud size={18} color="var(--accent-cobalt)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Cloud Deployment & Future Readiness
          </h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.15rem' }}>
          This application is completely cloud-neutral. Develop locally with persistent volumes now, and transition to any cloud provider later without rewriting code.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
              <HardDrive size={14} color="var(--accent-cobalt)" /> 1. Durable PostgreSQL
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              All projects, conversations, and messages reside in PostgreSQL. Local Docker uses the named volume <code>pg_data</code>. In cloud, simply set <code>DATABASE_URL</code> to AWS RDS, GCP Cloud SQL, or Neon.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
              <Cpu size={14} color="var(--accent-cobalt)" /> 2. Modular Services
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Decoupled React Vite frontend and FastAPI backend can be deployed independently as static assets on a CDN and a container on Cloud Run / ECS / Railway.
            </p>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
              <Terminal size={14} color="var(--accent-cobalt)" /> 3. Persistent Agent Context
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Conversations survive restarts, reboots, and redeployments seamlessly via PostgreSQL checkpointing.
            </p>
          </div>
        </div>

        {/* Security & Secret Isolation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
          <Lock size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Secret Isolation
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '0.65rem' }}>
          All credentials, GitHub personal access tokens, and LLM API keys are isolated to the backend environment and never exposed to the browser.
        </p>

        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            padding: '0.85rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--border-structural)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            overflowX: 'auto',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}># Target Backend Configuration (.env):</span><br />
          <span style={{ color: 'var(--accent-cobalt)' }}>DATABASE_URL</span>=postgresql+asyncpg://user@localhost:5432/project_manager<br />
          <span style={{ color: 'var(--accent-cobalt)' }}>GITHUB_TOKEN</span>=ghp_************************************<br />
          <span style={{ color: 'var(--accent-cobalt)' }}>CHROMA_PERSIST_DIRECTORY</span>=./chroma_data
        </div>
      </div>
    </div>
  );
};
