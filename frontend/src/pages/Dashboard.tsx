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
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/StatsCard';
import { ProjectCard } from '../components/ProjectCard';
import { StatsSkeleton, CardSkeleton } from '../components/LoadingSkeleton';

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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Project Portfolio</h1>
          <p className="page-subtitle">
            Centralized showcase, repository analyzer, and local execution dashboard.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/agent" className="btn btn-secondary">
            <Sparkles size={16} color="var(--accent-primary)" />
            AI Assistant
          </Link>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} />
            Add Project
          </Link>
        </div>
      </div>

      {/* Quick Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '600px' }}>
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
            style={{ paddingLeft: '42px', height: '46px', fontSize: '0.95rem' }}
          />
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div
          className="card"
          style={{
            borderColor: 'var(--danger)',
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

      {/* Statistics Cards Grid */}
      {loading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid-stats">
          <StatsCard
            title="Total Projects"
            value={stats.total_projects}
            icon={<FolderGit2 size={24} />}
            subtitle="Cataloged in database"
            accentColor="var(--accent-primary)"
          />
          <StatsCard
            title="Live Deployed"
            value={stats.deployed_projects}
            icon={<ExternalLink size={24} />}
            subtitle="Direct live demo links"
            accentColor="var(--info)"
          />
          <StatsCard
            title="Completed"
            value={stats.completed_projects}
            icon={<CheckCircle2 size={24} />}
            subtitle="Production ready"
            accentColor="var(--success)"
          />
          <StatsCard
            title="In Development"
            value={stats.in_development_projects}
            icon={<Clock size={24} />}
            subtitle="Active engineering"
            accentColor="var(--warning)"
          />
        </div>
      ) : null}

      {/* Top Technologies Bar */}
      {stats && stats.top_technologies && stats.top_technologies.length > 0 && (
        <div
          className="card"
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
            <Code2 size={16} /> Top Technologies:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.top_technologies.map((tech) => (
              <button
                key={tech.name}
                onClick={() => navigate(`/projects?technology=${encodeURIComponent(tech.name)}`)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{tech.name}</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {tech.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects Section */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Recent Projects
        </h2>
        <Link
          to="/projects"
          style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 500 }}
        >
          View all projects →
        </Link>
      </div>

      {loading ? (
        <div className="grid-cards">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats && stats.recent_projects && stats.recent_projects.length > 0 ? (
        <div className="grid-cards">
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
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            borderStyle: 'dashed',
          }}
        >
          <FolderGit2
            size={42}
            color="var(--text-muted)"
            style={{ margin: '0 auto 1rem auto' }}
          />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No projects added yet
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              maxWidth: '460px',
              margin: '0 auto 1.5rem auto',
            }}
          >
            Paste your GitHub repository URLs to automatically analyze, extract technologies, and showcase your engineering work.
          </p>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} /> Add Your First Project
          </Link>
        </div>
      )}
    </div>
  );
};
