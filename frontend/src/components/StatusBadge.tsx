import React from 'react';
import { ProjectStatus, ProvenanceType } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-status-in-development';
  let glyph = '○';

  if (status === 'Completed') {
    badgeClass = 'badge-status-completed';
    glyph = '●';
  } else if (status === 'Incomplete') {
    badgeClass = 'badge-status-incomplete';
    glyph = '◐';
  } else if (status === 'Archived') {
    badgeClass = 'badge-status-archived';
    glyph = '⊘';
  } else if (status === 'Planning') {
    badgeClass = 'badge-status-planning';
    glyph = '◌';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{ fontSize: '0.65rem' }}>{glyph}</span> {status}
    </span>
  );
};

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  source?: string | null;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, source }) => {
  const codes: Record<ProvenanceType, string> = {
    detected: '[DET]',
    inferred: '[INF]',
    needs_review: '[REV]',
    missing: '[MIS]',
  };

  const labels: Record<ProvenanceType, string> = {
    detected: 'Detected',
    inferred: 'Inferred',
    needs_review: 'Review Needed',
    missing: 'Missing',
  };

  return (
    <span
      className={`badge badge-provenance-${provenance}`}
      title={source ? `Evidence: ${source}` : undefined}
      style={{ fontSize: '0.68rem', cursor: source ? 'help' : 'default' }}
    >
      <span style={{ opacity: 0.75 }}>{codes[provenance]}</span> {labels[provenance] || provenance}
    </span>
  );
};
