import React from 'react';
import { DashboardStats } from '../types';

interface ProjectStatusDistributionProps {
  stats: DashboardStats;
}

export const ProjectStatusDistribution: React.FC<ProjectStatusDistributionProps> = ({ stats }) => {
  const total = stats.total_projects;
  if (total === 0) return null;

  const inDevPct = Math.round((stats.in_development_projects / total) * 100);
  const completedPct = Math.round((stats.completed_projects / total) * 100);
  const incompletePct = Math.round((stats.incomplete_projects / total) * 100);
  const planningPct = Math.round((stats.planning_projects / total) * 100);
  const archivedPct = Math.max(0, 100 - (inDevPct + completedPct + incompletePct + planningPct));

  return (
    <div className="aurora-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Project Lifecycle Distribution
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Real-time status breakdown across {total} cataloged repositories
          </span>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div
        style={{
          height: '10px',
          width: '100%',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {completedPct > 0 && (
          <div
            style={{ width: `${completedPct}%`, background: 'var(--success)' }}
            title={`Completed: ${stats.completed_projects} (${completedPct}%)`}
          />
        )}
        {inDevPct > 0 && (
          <div
            style={{ width: `${inDevPct}%`, background: 'var(--primary-accent)' }}
            title={`In Development: ${stats.in_development_projects} (${inDevPct}%)`}
          />
        )}
        {incompletePct > 0 && (
          <div
            style={{ width: `${incompletePct}%`, background: 'var(--warning)' }}
            title={`Incomplete: ${stats.incomplete_projects} (${incompletePct}%)`}
          />
        )}
        {planningPct > 0 && (
          <div
            style={{ width: `${planningPct}%`, background: 'var(--secondary-accent)' }}
            title={`Planning: ${stats.planning_projects} (${planningPct}%)`}
          />
        )}
        {archivedPct > 0 && (
          <div
            style={{ width: `${archivedPct}%`, background: 'var(--text-muted)' }}
            title={`Archived: ${stats.archived_projects} (${archivedPct}%)`}
          />
        )}
      </div>

      {/* Legend Indicators */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.completed_projects} ({completedPct}%)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-accent)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>In Development:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.in_development_projects} ({inDevPct}%)</span>
        </div>

        {stats.incomplete_projects > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Incomplete:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.incomplete_projects} ({incompletePct}%)</span>
          </div>
        )}

        {stats.planning_projects > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary-accent)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Planning:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.planning_projects} ({planningPct}%)</span>
          </div>
        )}

        {stats.deployed_projects > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ color: 'var(--secondary-accent)', fontWeight: 600 }}>
              ⚡ {stats.deployed_projects} Live Deployed
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
