import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';

interface TopNavProps {
  onOpenSearch: () => void;
  onMobileMenuToggle: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSearch, onMobileMenuToggle }) => {
  const location = useLocation();

  // Clear, human-friendly breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects/new')) return 'Projects / Add Project';
    if (path.startsWith('/projects/')) return 'Projects / Project Details';
    if (path === '/projects') return 'All Projects';
    if (path === '/agent') return 'AI Workspace';
    if (path === '/settings') return 'Settings & Infrastructure';
    return 'Workspace';
  };

  return (
    <header className="observatory-topbar">
      {/* Left: Mobile Menu & Current Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onMobileMenuToggle}
          className="btn-icon"
          style={{ display: 'none', color: 'var(--text-secondary)' }}
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Right: Quick Search & Add Project */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.4rem 0.75rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-structural)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          title="Search Projects (⌘K)"
        >
          <Search size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.78rem' }}>Search projects...</span>
          <kbd
            style={{
              padding: '0.1rem 0.4rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-structural)',
              borderRadius: '3px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Project Action */}
        <Link to="/projects/new" className="obs-btn obs-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
          <Plus size={14} /> Add Project
        </Link>
      </div>
    </header>
  );
};
