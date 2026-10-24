import React from 'react';

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="obs-card" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '55%', height: '20px', background: 'var(--obs-canvas)' }} />
            <div className="skeleton" style={{ width: '25%', height: '18px', background: 'var(--obs-canvas)' }} />
          </div>
          <div className="skeleton" style={{ width: '90%', height: '14px', background: 'var(--obs-canvas)' }} />
          <div className="skeleton" style={{ width: '75%', height: '14px', background: 'var(--obs-canvas)' }} />
          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '50px', height: '20px', background: 'var(--obs-canvas)' }} />
            <div className="skeleton" style={{ width: '60px', height: '20px', background: 'var(--obs-canvas)' }} />
          </div>
        </div>
      ))}
    </>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="obs-card" style={{ height: '110px', padding: '1.25rem' }}>
          <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '1rem', background: 'var(--obs-canvas)' }} />
          <div className="skeleton" style={{ width: '50%', height: '28px', background: 'var(--obs-canvas)' }} />
        </div>
      ))}
    </div>
  );
};
