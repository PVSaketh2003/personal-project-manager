import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '55%', height: '22px' }} />
        <div className="skeleton" style={{ width: '25%', height: '18px' }} />
      </div>
      <div className="skeleton" style={{ width: '90%', height: '14px' }} />
      <div className="skeleton" style={{ width: '75%', height: '14px' }} />
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
        <div className="skeleton" style={{ width: '50px', height: '20px' }} />
        <div className="skeleton" style={{ width: '60px', height: '20px' }} />
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid-stats">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ height: '110px' }}>
          <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '50%', height: '32px' }} />
        </div>
      ))}
    </div>
  );
};
