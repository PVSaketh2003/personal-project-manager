import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  FolderGit2,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/StatsCard';
import { ProjectCard } from '../components/ProjectCard';
import { StatsSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { ProjectStatusDistribution } from '../components/ProjectStatusDistribution';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      loadDashboard();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div
        className="aurora-card"
        style={{
          marginBottom: '2rem',
          padding: '2rem 2.25rem',
          background: 'linear-gradient(135deg, rgba(21, 30, 53, 0.9) 0%, rgba(16, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(139, 124, 255, 0.25)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
        }}
      >
        <div className="aurora-glow-top" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'var(--secondary-accent-subtle)', border: '1px solid var(--border-cyan)', fontSize: '0.74rem', color: 'var(--secondary-accent)', fontWeight: 600, marginBottom: '0.85rem' }}>
              <Sparkles size={12} /> Autonomous AI Workspace Active
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Your projects, in one workspace.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Centralized developer platform to organize, inspect repositories with AST manifests, query through LangGraph agents, and launch local environments directly on macOS.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/agent" className="btn btn-secondary">
              <Sparkles size={15} color="var(--primary-accent)" />
              AI Assistant
            </Link>
            <Link to="/projects/new" className="btn btn-primary">
              <Plus size={16} />
              Add Project
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '640px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects, technologies (FastAPI, React, PyTorch...), or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '44px', height: '46px', fontSize: '0.92rem' }}
          />
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div
          className="aurora-card"
          style={{
            borderColor: 'var(--danger-border)',
            background: 'var(--danger-bg)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} color="var(--danger)" />
          <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboard} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      )}

      {/* Asymmetric Metrics Grid */}
      {loading ? (
        <StatsSkeleton />
      ) : stats ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <StatsCard
              title="Total Projects"
              value={stats.total_projects}
              icon={<FolderGit2 size={18} />}
              subtitle="Indexed in PostgreSQL"
              accentColor="var(--primary-accent)"
            />
            <StatsCard
              title="Live Deployments"
              value={stats.deployed_projects}
              icon={<ExternalLink size={18} />}
              subtitle="Direct live demo links"
              accentColor="var(--secondary-accent)"
              trend={stats.total_projects > 0 ? `${Math.round((stats.deployed_projects / stats.total_projects) * 100)}% deployed` : undefined}
            />
            <StatsCard
              title="Completed Projects"
              value={stats.completed_projects}
              icon={<CheckCircle2 size={18} />}
              subtitle="Production verified"
              accentColor="var(--success)"
            />
            <StatsCard
              title="Active Development"
              value={stats.in_development_projects}
              icon={<Clock size={18} />}
              subtitle="Currently in engineering"
              accentColor="var(--warning)"
            />
          </div>

          {/* Project Lifecycle Distribution Bar */}
          <ProjectStatusDistribution stats={stats} />
        </>
      ) : null}

      {/* Top Technologies Filter Bar */}
      {stats && stats.top_technologies && stats.top_technologies.length > 0 && (
        <div
          className="aurora-card"
          style={{
            marginBottom: '2.5rem',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Code2 size={16} color="var(--secondary-accent)" /> Stack Filters:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.top_technologies.map((tech) => (
              <button
                key={tech.name}
                onClick={() => navigate(`/projects?technology=${encodeURIComponent(tech.name)}`)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--secondary-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <span>{tech.name}</span>
                <span style={{ color: 'var(--secondary-accent)', fontWeight: 700, fontSize: '0.72rem' }}>
                  {tech.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Recently Updated Projects
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Latest repository activity synced from GitHub
          </span>
        </div>
        <Link
          to="/projects"
          style={{ fontSize: '0.85rem', color: 'var(--secondary-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          View all projects <ArrowUpRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats && stats.recent_projects && stats.recent_projects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {stats.recent_projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="aurora-card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            borderStyle: 'dashed',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--primary-accent)',
            }}
          >
            <FolderGit2 size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No projects in workspace yet
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              maxWidth: '480px',
              margin: '0 auto 1.75rem auto',
              lineHeight: 1.6,
            }}
          >
            Import your GitHub repositories to automatically extract frameworks, dependencies, and setup instructions.
          </p>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} /> Import First Repository
          </Link>
        </div>
      )}
    </div>
  );
};
