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
  Sun,
  Moon,
  Cloud,
  HardDrive,
  Cpu,
  Terminal,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../api/client';
import { ComponentHealth, SettingsHealthResponse } from '../types';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<SettingsHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

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
              color: 'var(--obs-success)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} /> CONNECTED
          </span>
        );
      case 'not_configured':
        return (
          <span
            className="obs-tag"
            style={{
              color: 'var(--obs-warning)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <HelpCircle size={12} /> NOT CONFIGURED
          </span>
        );
      case 'disabled':
        return (
          <span
            className="obs-tag"
            style={{
              color: 'var(--obs-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            DISABLED
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span
            className="obs-tag"
            style={{
              color: 'var(--obs-error)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <XCircle size={12} /> UNAVAILABLE
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
      iconColor: 'var(--obs-cobalt)',
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
      iconColor: 'var(--obs-cobalt)',
      description: 'Persistent local vector database for semantic repository indexing and similarity search.',
      details: services.chromadb?.details,
      status: services.chromadb?.status || 'unavailable',
    },
    {
      key: 'github',
      name: 'GitHub REST API Integration',
      category: 'Repository Intelligence',
      icon: GithubIcon,
      iconColor: 'var(--obs-text)',
      description: 'Queries public repository trees, parses manifest dependencies, and extracts READMEs.',
      details: services.github?.details,
      status: services.github?.status || 'not_configured',
    },
    {
      key: 'langgraph',
      name: 'LangGraph Stateful Workflow',
      category: 'Agent Orchestration',
      icon: ShieldCheck,
      iconColor: 'var(--obs-success)',
      description: 'Multi-node state graph orchestrating intent classification, retrieval, and safety approvals.',
      details: services.langgraph?.details,
      status: services.langgraph?.status || 'connected',
    },
    {
      key: 'langchain_model',
      name: 'LangChain LLM Integration',
      category: 'Language Intelligence',
      icon: Activity,
      iconColor: 'var(--obs-warning)',
      description: 'Language model invocation layer with automatic fallback to local deterministic rules.',
      details: services.langchain_model?.details,
      status: services.langchain_model?.status || 'not_configured',
    },
    {
      key: 'langsmith',
      name: 'LangSmith Tracing Observability',
      category: 'Telemetry',
      icon: Eye,
      iconColor: 'var(--obs-cobalt)',
      description: 'End-to-end execution trace monitoring with automatic token redaction.',
      details: services.langsmith?.details,
      status: services.langsmith?.status || 'disabled',
    },
  ];

  const connectedCount = serviceList.filter((s) => s.status === 'connected').length;

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      
      {/* Header */}
      <div className="obs-card" style={{ padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span className="obs-tag" style={{ background: 'var(--obs-graphite)', color: 'var(--obs-chartreuse)', borderColor: 'var(--obs-border)' }}>
              OBS // CONFIGURATION & TELEMETRY
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
              [SYSTEM INDEX 05]
            </span>
          </div>
          <h1 className="obs-page-title" style={{ margin: 0, fontSize: '1.65rem' }}>
            Settings & Infrastructure Observatory
          </h1>
          <p className="obs-page-subtitle" style={{ margin: '0.25rem 0 0' }}>
            Inspect system diagnostics, switch visual themes, and review cloud-ready deployment specifications.
          </p>
        </div>

        <button className="obs-btn obs-btn-secondary" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {/* Visual Identity & Theme Configuration Card */}
      <div className="obs-card" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--obs-border)', paddingBottom: '0.65rem' }}>
          <Sun size={16} color="var(--obs-cobalt)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
            VISUAL IDENTITY & THEME SPECIFICATION
          </h2>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--obs-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Kinetic Observatory features a dual-system design with a default Warm Mineral light surface and an Obsidian Ink dark counterpart. User preferences are persisted locally in <code>localStorage</code>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Light Theme Option Card */}
          <div
            onClick={() => theme === 'dark' && toggleTheme()}
            style={{
              padding: '1.25rem',
              background: '#F6F5EF',
              border: theme === 'light' ? '2px solid var(--obs-cobalt)' : '1px solid #CFD1C6',
              cursor: 'pointer',
              color: '#111412',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
                <Sun size={16} color="#526BFF" />
                <span>WARM MINERAL (LIGHT)</span>
              </div>
              {theme === 'light' && (
                <span className="obs-tag" style={{ background: '#526BFF', color: '#FFFFFF', borderColor: '#526BFF', fontSize: '0.68rem' }}>
                  ACTIVE (DEFAULT)
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#686F65', margin: 0, lineHeight: 1.5 }}>
              Editorial warm mineral canvas (#EAE8DF) with porcelain cards, obsidian ink typography, and technical cobalt annotations.
            </p>
          </div>

          {/* Dark Theme Option Card */}
          <div
            onClick={() => theme === 'light' && toggleTheme()}
            style={{
              padding: '1.25rem',
              background: '#111412',
              border: theme === 'dark' ? '2px solid var(--obs-chartreuse)' : '1px solid #202522',
              cursor: 'pointer',
              color: '#F5F5EE',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
                <Moon size={16} color="#D7F36A" />
                <span>OBSIDIAN INK (DARK)</span>
              </div>
              {theme === 'dark' && (
                <span className="obs-tag" style={{ background: '#D7F36A', color: '#111412', borderColor: '#D7F36A', fontSize: '0.68rem', fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#8D9488', margin: 0, lineHeight: 1.5 }}>
              Precision observatory dark workstation (#111412) with graphite surfaces (#202522) and signal chartreuse markers.
            </p>
          </div>
        </div>
      </div>

      {/* Top Health Telemetry Strip */}
      <div
        className="obs-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem 1.75rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
            MONITORED SUBSYSTEMS
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--obs-text)' }}>
            {serviceList.length} SERVICES
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
            ONLINE & CONNECTED
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--obs-success)' }}>
            {connectedCount} / {serviceList.length} ACTIVE
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
            PERSISTENT CONVERSATIONS
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--obs-cobalt)' }}>
            POSTGRESQL DURABLE
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
            CREDENTIAL ISOLATION
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--obs-chartreuse)' }}>
            BACKEND ENFORCED
          </div>
        </div>
      </div>

      {/* Services Health List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {serviceList.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.key}
              className="obs-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.15rem 1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--obs-canvas)',
                    border: '1px solid var(--obs-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: service.iconColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--obs-text)', margin: 0 }}>
                      {service.name}
                    </h3>
                    <span className="obs-tag" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                      {service.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--obs-muted)', margin: '0 0 0.2rem' }}>
                    {service.description}
                  </p>
                  {service.details && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
                      DIAGNOSTIC: {service.details}
                    </div>
                  )}
                </div>
              </div>

              <div>{getStatusBadge(service.status as any)}</div>
            </div>
          );
        })}
      </div>

      {/* Cloud-Ready Architecture & Deployment Specification */}
      <div className="obs-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Cloud size={18} color="var(--obs-cobalt)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>
            CLOUD-READY ARCHITECTURE & FUTURE DEPLOYMENT SPECIFICATION
          </h2>
        </div>

        <p style={{ color: 'var(--obs-text)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          This application is architected to run seamlessly in local development today and deploy to any major cloud provider in the future without rewriting core business logic.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--obs-canvas)', border: '1px solid var(--obs-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              <HardDrive size={14} color="var(--obs-cobalt)" /> 1. CLOUD-INDEPENDENT PERSISTENCE
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--obs-muted)', margin: 0, lineHeight: 1.5 }}>
              PostgreSQL is the single source of truth for projects, conversation sessions, and ordered message history. In local Docker, a named volume (<code>project_manager_pgdata</code>) prevents data loss. In the cloud, simply supply <code>DATABASE_URL</code> pointing to AWS RDS, GCP Cloud SQL, or Neon.
            </p>
          </div>

          <div style={{ padding: '1rem', background: 'var(--obs-canvas)', border: '1px solid var(--obs-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              <Cpu size={14} color="var(--obs-cobalt)" /> 2. MODULAR SERVICE BOUNDARIES
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--obs-muted)', margin: 0, lineHeight: 1.5 }}>
              The React Vite frontend and FastAPI backend are decoupled. They can be built as standalone OCI container images or deployed as static assets on an edge CDN with an autoscaling container backend (AWS ECS, Google Cloud Run, Railway, or VPS).
            </p>
          </div>

          <div style={{ padding: '1rem', background: 'var(--obs-canvas)', border: '1px solid var(--obs-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              <Terminal size={14} color="var(--obs-cobalt)" /> 3. AGENT CHECKPOINTING & DURABILITY
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--obs-muted)', margin: 0, lineHeight: 1.5 }}>
              The LangGraph workflow state resolves checkpoints by conversation ID. AI conversations survive client refreshes, backend restarts, and server reboots seamlessly.
            </p>
          </div>
        </div>

        {/* Security & Isolation Boundaries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <Lock size={15} color="var(--obs-chartreuse)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            SECRET ISOLATION & ENVIRONMENT CONFIGURATION
          </span>
        </div>

        <p style={{ color: 'var(--obs-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '0.85rem' }}>
          All credentials, GitHub personal access tokens, and LLM API keys are isolated exclusively to backend environment variables. The browser frontend never receives unmasked credentials.
        </p>

        <div
          style={{
            background: 'var(--obs-canvas)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '1rem 1.25rem',
            border: '1px solid var(--obs-border)',
            color: 'var(--obs-text)',
            lineHeight: 1.65,
            overflowX: 'auto',
          }}
        >
          <span style={{ color: 'var(--obs-muted)' }}># Target Backend Configuration Pattern (backend/.env):</span><br />
          <span style={{ color: 'var(--obs-cobalt)' }}>DATABASE_URL</span>=postgresql+asyncpg://user@localhost:5432/project_manager<br />
          <span style={{ color: 'var(--obs-cobalt)' }}>GITHUB_TOKEN</span>=ghp_************************************<br />
          <span style={{ color: 'var(--obs-cobalt)' }}>CHROMA_PERSIST_DIRECTORY</span>=./chroma_data<br />
          <span style={{ color: 'var(--obs-cobalt)' }}>LANGSMITH_TRACING</span>=false<br />
          <span style={{ color: 'var(--obs-cobalt)' }}>LOCAL_PROJECTS_DIR</span>=/Users/pvsairamsaketh/Documents/projects_local
        </div>
      </div>
    </div>
  );
};
