import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  AlertCircle,
  Bot,
  ExternalLink,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { StatsSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { ProjectStatusDistribution } from '../components/ProjectStatusDistribution';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service.');
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

  const displayedProjects = stats?.recent_projects.filter((p) => {
    if (!selectedTech) return true;
    return (
      p.technologies?.some((t) => t.toLowerCase() === selectedTech.toLowerCase()) ||
      p.primary_language?.toLowerCase() === selectedTech.toLowerCase()
    );
  }) || [];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Editorial Overview Banner */}
      <div
        className="obs-card"
        style={{
          padding: '2rem 2.25rem',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            Developer Project Intelligence
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.15, margin: '0 0 0.5rem' }}>
            Your projects, in one workspace.
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            Inspect software repositories, analyze detected tech stacks, run projects locally, and manage tasks with your persistent AI assistant.
          </p>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/projects/new" className="obs-btn obs-btn-primary">
              <Plus size={15} /> Add GitHub Repo
            </Link>
            <Link to="/agent" className="obs-btn obs-btn-secondary">
              <Bot size={15} /> AI Assistant
            </Link>
            <Link to="/projects" className="obs-btn obs-btn-secondary">
              <FolderGit2 size={15} /> View All Projects
            </Link>
          </div>
        </div>

        {/* Quick Search Widget */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-structural)',
            borderRadius: '6px',
            padding: '1.25rem',
            width: '100%',
            maxWidth: '340px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
            Quick Find
          </div>
          <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search name, language, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="obs-input"
              style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.82rem' }}
            />
          </div>
          <button type="submit" className="obs-btn obs-btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>
            Search Catalog
          </button>
        </form>
      </div>

      {error && (
        <div className="obs-card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Metrics Row */}
      {loading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          
          <div className="obs-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FolderGit2 size={13} color="var(--accent-primary)" /> Total Projects
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {stats.total_projects}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Cataloged repositories
            </div>
          </div>

          <div className="obs-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={13} color="var(--success)" /> Completed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
              {stats.completed_projects}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Production & finished builds
            </div>
          </div>

          <div className="obs-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Code2 size={13} color="var(--accent-cobalt)" /> In Development
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cobalt)', letterSpacing: '-0.02em' }}>
              {stats.in_development_projects}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Active engineering repos
            </div>
          </div>

          <div className="obs-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ExternalLink size={13} color="var(--accent-primary)" /> Live Deployed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stats.deployed_projects > 0 ? 'var(--accent-primary)' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {stats.deployed_projects}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Active public deployments
            </div>
          </div>

        </div>
      ) : null}

      {/* Lifecycle Status Distribution Strip */}
      {stats && (
        <ProjectStatusDistribution stats={stats} />
      )}

      {/* Technology Filter Bar */}
      {stats && stats.top_technologies && stats.top_technologies.length > 0 && (
        <div className="obs-card" style={{ padding: '1.15rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Filter by Technology:
            </div>
            {selectedTech && (
              <button
                onClick={() => setSelectedTech(null)}
                style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}
              >
                Clear filter ({selectedTech})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {stats.top_technologies.slice(0, 12).map((t) => {
              const isSelected = selectedTech?.toLowerCase() === t.name.toLowerCase();
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedTech(isSelected ? null : t.name)}
                  className="obs-tag"
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? '#111412' : 'var(--text-primary)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-structural)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.74rem',
                    padding: '0.25rem 0.65rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{t.name}</span>
                  <span style={{ opacity: isSelected ? 0.8 : 0.6, fontSize: '0.68rem', marginLeft: '3px' }}>({t.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Landscape */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Projects
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
              {selectedTech ? `Showing projects using ${selectedTech}` : 'Latest cataloged repositories'}
            </p>
          </div>

          <Link to="/projects" className="obs-btn obs-btn-secondary" style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}>
            View All ({stats?.total_projects || 0}) →
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <CardSkeleton count={3} />
          </div>
        ) : displayedProjects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {displayedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="obs-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <FolderGit2 size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No projects found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {selectedTech ? `No projects matching "${selectedTech}".` : 'Add your first repository to begin.'}
            </p>
            <Link to="/projects/new" className="obs-btn obs-btn-primary">
              <Plus size={14} /> Ingest Repository
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};
