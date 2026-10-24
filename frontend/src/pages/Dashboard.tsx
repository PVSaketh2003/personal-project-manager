import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Plus,
  Search,
  AlertCircle,
  Cpu,
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

  // Filter recent projects by selected technology if active
  const displayedProjects = stats?.recent_projects.filter((p) => {
    if (!selectedTech) return true;
    return (
      p.technologies?.some((t) => t.toLowerCase() === selectedTech.toLowerCase()) ||
      p.primary_language?.toLowerCase() === selectedTech.toLowerCase()
    );
  }) || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ZONE A: EDITORIAL OBSERVATORY INTRO */}
      <div
        className="obs-card"
        style={{
          marginBottom: '2rem',
          padding: '2.25rem',
          backgroundColor: 'var(--bg-surface-elevated)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span className="obs-corner-mark top-right">[COORD: LAT 37.77 // LON -122.41]</span>
        <span className="obs-corner-mark top-left">[OBSERVATORY // PRIME]</span>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            marginTop: '0.75rem',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '1px', backgroundColor: 'var(--accent-signal)' }} />
              INSTRUMENT PANEL // CATALOG MATRIX
            </div>

            <h1
              style={{
                fontSize: '2.6rem',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                lineHeight: 1.05,
                marginBottom: '0.75rem',
              }}
            >
              Your projects, in one workspace.
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              High-precision technical observatory monitoring software repositories, AST dependency manifests, LangGraph agent workflows, and local execution processes.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/projects/new" className="btn btn-primary">
                <Plus size={15} /> Ingest Repository
              </Link>
              <Link to="/agent" className="btn btn-secondary">
                <Cpu size={15} /> AI Command Console
              </Link>
              <Link to="/projects" className="btn btn-secondary">
                <FolderGit2 size={15} /> Catalog Explorer
              </Link>
            </div>
          </div>

          {/* SVG Topology Visualizer */}
          <div
            style={{
              width: '260px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-structural)',
              borderRadius: '3px',
              backgroundColor: 'var(--bg-surface)',
              position: 'relative',
            }}
          >
            <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="220" y2="20" stroke="var(--border-structural)" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="60" x2="220" y2="60" stroke="var(--border-structural)" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="100" x2="220" y2="100" stroke="var(--border-structural)" strokeWidth="0.8" strokeDasharray="3 3" />
              
              {/* Connection Vectors */}
              <line x1="40" y1="60" x2="110" y2="35" stroke="var(--border-technical)" strokeWidth="1.2" />
              <line x1="40" y1="60" x2="110" y2="85" stroke="var(--border-technical)" strokeWidth="1.2" />
              <line x1="110" y1="35" x2="190" y2="60" stroke="var(--accent-cobalt)" strokeWidth="1.5" />
              <line x1="110" y1="85" x2="190" y2="60" stroke="var(--border-technical)" strokeWidth="1.2" />

              {/* Node Glyphs */}
              <circle cx="40" cy="60" r="8" fill="var(--bg-surface-elevated)" stroke="var(--text-primary)" strokeWidth="2" />
              <circle cx="110" cy="35" r="7" fill="var(--bg-surface-elevated)" stroke="var(--accent-signal)" strokeWidth="2" />
              <circle cx="110" cy="85" r="7" fill="var(--bg-surface-elevated)" stroke="var(--text-secondary)" strokeWidth="2" />
              <circle cx="190" cy="60" r="10" fill="var(--accent-primary)" />
              <circle cx="190" cy="60" r="4" fill="var(--accent-signal)" />

              {/* Monospace Labels */}
              <text x="32" y="80" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">INGEST</text>
              <text x="104" y="24" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">AST</text>
              <text x="100" y="103" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">VECTOR</text>
              <text x="178" y="84" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">OBS-CORE</text>
            </svg>
            <span style={{ position: 'absolute', bottom: '4px', right: '6px', fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              TOPOLOGY // 01
            </span>
          </div>
        </div>
      </div>

      {/* ZONE B: PROJECT METRICS TELEMETRY STRIP */}
      {loading ? (
        <StatsSkeleton />
      ) : stats ? (
        <>
          <div className="telemetry-strip">
            <div className="telemetry-cell">
              <span className="telemetry-label">
                <FolderGit2 size={13} color="var(--text-muted)" /> Total Projects
              </span>
              <div className="telemetry-value">{stats.total_projects}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Cataloged in PostgreSQL
              </span>
            </div>

            <div className="telemetry-cell">
              <span className="telemetry-label">
                <ExternalLink size={13} color="var(--accent-cobalt)" /> Live Deployments
              </span>
              <div className="telemetry-value" style={{ color: 'var(--accent-cobalt)' }}>
                {stats.deployed_projects}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {stats.total_projects > 0 ? `${Math.round((stats.deployed_projects / stats.total_projects) * 100)}% active production` : 'No live links'}
              </span>
            </div>

            <div className="telemetry-cell">
              <span className="telemetry-label">
                <CheckCircle2 size={13} color="var(--success)" /> Production Completed
              </span>
              <div className="telemetry-value" style={{ color: 'var(--success)' }}>
                {stats.completed_projects}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Fully verified specifications
              </span>
            </div>

            <div className="telemetry-cell">
              <span className="telemetry-label">
                <Clock size={13} color="var(--warning)" /> Active Engineering
              </span>
              <div className="telemetry-value" style={{ color: 'var(--warning)' }}>
                {stats.in_development_projects}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                In development cycle
              </span>
            </div>
          </div>

          {/* Segmented Lifecycle Distribution Bar */}
          <ProjectStatusDistribution stats={stats} />
        </>
      ) : null}

      {/* Error state */}
      {error && (
        <div
          className="obs-card"
          style={{
            borderColor: 'var(--danger-border)',
            backgroundColor: 'var(--danger-bg)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={18} color="var(--danger)" />
          <span style={{ color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 600 }}>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboard} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      )}

      {/* ZONE C: PROJECT LANDSCAPE & FILTER MATRIX */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Project Landscape
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            INDEX // RECENT SPECIFICATIONS [{displayedProjects.length} ENTRIES]
          </span>
        </div>

        {/* Quick Filter Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.45rem' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search landscape..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.82rem' }}
            />
          </div>
        </form>
      </div>

      {/* Technology Pills Filter Bar */}
      {stats && stats.top_technologies && stats.top_technologies.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            STACK FILTER:
          </span>
          <button
            onClick={() => setSelectedTech(null)}
            className="badge"
            style={{
              cursor: 'pointer',
              backgroundColor: selectedTech === null ? 'var(--text-primary)' : 'var(--bg-surface)',
              color: selectedTech === null ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: '1px solid var(--border-structural)',
            }}
          >
            ALL
          </button>
          {stats.top_technologies.slice(0, 8).map((tech) => (
            <button
              key={tech.name}
              onClick={() => setSelectedTech(selectedTech === tech.name ? null : tech.name)}
              className="badge"
              style={{
                cursor: 'pointer',
                backgroundColor: selectedTech === tech.name ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: selectedTech === tech.name ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                border: '1px solid var(--border-structural)',
              }}
            >
              {tech.name} ({tech.count})
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : displayedProjects.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={loadDashboard}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div
          className="obs-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '3px', backgroundColor: 'var(--bg-surface-recessed)', border: '1px solid var(--border-structural)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
            <FolderGit2 size={20} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.45rem' }}>
            No Projects Cataloged Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Paste a public or authorized GitHub repository URL to initiate AST inspection, dependency parsing, and automated project profiling.
          </p>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={14} /> Ingest First Repository
          </Link>
        </div>
      )}
    </div>
  );
};
