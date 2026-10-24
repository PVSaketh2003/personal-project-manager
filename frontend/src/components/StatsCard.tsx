import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  accentColor?: string;
  trend?: string;
  indexCode?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  accentColor = 'var(--accent-primary)',
  trend,
  indexCode,
}) => {
  return (
    <div className="obs-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {indexCode && <span className="obs-corner-mark top-right">{indexCode}</span>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
          {title}
        </span>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '2px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-structural)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.15rem' }}>
        {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
        {trend && (
          <span style={{ color: accentColor, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
