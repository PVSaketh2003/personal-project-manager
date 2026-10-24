import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Plus, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TopNavProps {
  onOpenSearch: () => void;
  onMobileMenuToggle: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSearch, onMobileMenuToggle }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Parse path for technical breadcrumb coordinates
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'OBS // CATALOG // OVERVIEW';
    if (path.startsWith('/projects/new')) return 'OBS // INGESTION // REPO_IMPORT';
    if (path.startsWith('/projects/')) return 'OBS // CATALOG // SPECIFICATION';
    if (path === '/projects') return 'OBS // CATALOG // ALL_ENTRIES';
    if (path === '/agent') return 'OBS // INTELLIGENCE // WORKSPACE';
    if (path === '/settings') return 'OBS // SYSTEM // TELEMETRY';
    return 'OBS // WORKSPACE';
  };

  return (
    <header className="observatory-topbar">
      {/* Left: Mobile Toggle & Technical Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onMobileMenuToggle}
          className="btn-icon"
          style={{ display: 'none', color: 'var(--text-secondary)' }}
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Right: Search, Theme Toggle, & Quick Add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-structural)',
            borderRadius: '3px',
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
          title="Search Projects (⌘K)"
        >
          <Search size={14} color="var(--text-muted)" />
          <span style={{ display: 'none' }}>Search...</span>
          <kbd
            style={{
              padding: '0.1rem 0.35rem',
              backgroundColor: 'var(--bg-surface-recessed)',
              border: '1px solid var(--border-structural)',
              borderRadius: '2px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-structural)',
            borderRadius: '3px',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
          title={`Switch to ${theme === 'light' ? 'Obsidian Dark' : 'Warm Mineral Light'} Theme`}
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>DARK</span>
            </>
          ) : (
            <>
              <Sun size={14} color="var(--accent-signal)" />
              <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-signal)' }}>LIGHT</span>
            </>
          )}
        </button>

        {/* Quick Add Project Action */}
        <Link to="/projects/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> Ingest Repo
        </Link>
      </div>
    </header>
  );
};
