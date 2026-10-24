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
    <div className="obs-card" style={{ marginBottom: '2rem' }}>
      <span className="obs-corner-mark top-right">[METRIC: LIFECYCLE_TOPOLOGY]</span>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
            Lifecycle Status Distribution
          </h3>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Total cataloged entries: {total}
          </span>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div
        style={{
          height: '8px',
          width: '100%',
          borderRadius: '2px',
          backgroundColor: 'var(--bg-surface-recessed)',
          display: 'flex',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '1px solid var(--border-structural)',
        }}
      >
        {completedPct > 0 && (
          <div
            style={{ width: `${completedPct}%`, backgroundColor: 'var(--success)' }}
            title={`Completed: ${stats.completed_projects} (${completedPct}%)`}
          />
        )}
        {inDevPct > 0 && (
          <div
            style={{ width: `${inDevPct}%`, backgroundColor: 'var(--accent-cobalt)' }}
            title={`In Development: ${stats.in_development_projects} (${inDevPct}%)`}
          />
        )}
        {incompletePct > 0 && (
          <div
            style={{ width: `${incompletePct}%`, backgroundColor: 'var(--warning)' }}
            title={`Incomplete: ${stats.incomplete_projects} (${incompletePct}%)`}
          />
        )}
        {planningPct > 0 && (
          <div
            style={{ width: `${planningPct}%`, backgroundColor: 'var(--border-technical)' }}
            title={`Planning: ${stats.planning_projects} (${planningPct}%)`}
          />
        )}
        {archivedPct > 0 && (
          <div
            style={{ width: `${archivedPct}%`, backgroundColor: 'var(--text-muted)' }}
            title={`Archived: ${stats.archived_projects} (${archivedPct}%)`}
          />
        )}
      </div>

      {/* Legend Indicators */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.74rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '1px', backgroundColor: 'var(--success)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
          <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{stats.completed_projects} ({completedPct}%)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '1px', backgroundColor: 'var(--accent-cobalt)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>In Development:</span>
          <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{stats.in_development_projects} ({inDevPct}%)</span>
        </div>

        {stats.incomplete_projects > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '1px', backgroundColor: 'var(--warning)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Incomplete:</span>
            <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{stats.incomplete_projects} ({incompletePct}%)</span>
          </div>
        )}

        {stats.planning_projects > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '1px', backgroundColor: 'var(--border-technical)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Planning:</span>
            <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{stats.planning_projects} ({planningPct}%)</span>
          </div>
        )}

        {stats.deployed_projects > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ color: 'var(--accent-cobalt)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚡ {stats.deployed_projects} Live Deployed
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
