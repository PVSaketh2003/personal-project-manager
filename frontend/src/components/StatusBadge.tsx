import React from 'react';
import { ProjectStatus, ProvenanceType } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-status-in-development';
  if (status === 'Completed') badgeClass = 'badge-status-completed';
  else if (status === 'Incomplete') badgeClass = 'badge-status-incomplete';
  else if (status === 'Archived') badgeClass = 'badge-status-archived';
  else if (status === 'Planning') badgeClass = 'badge-status-planning';

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance }) => {
  const labels: Record<ProvenanceType, string> = {
    detected: 'Detected',
    inferred: 'Inferred',
    needs_review: 'Needs Review',
    missing: 'Missing',
  };

  return (
    <span className={`badge badge-provenance-${provenance}`} style={{ fontSize: '0.7rem' }}>
      {labels[provenance] || provenance}
    </span>
  );
};
