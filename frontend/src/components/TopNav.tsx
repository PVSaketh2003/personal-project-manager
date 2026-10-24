import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Plus, Search } from 'lucide-react';

interface TopNavProps {
  onOpenMobile: () => void;
  onOpenSearch: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobile, onOpenSearch }) => {
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/projects') return 'All Projects';
    if (path === '/projects/new') return 'Add Project';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/agent') return 'AI Agent';
    if (path === '/settings') return 'Settings & Health';
    return 'Workspace';
  };

  return (
    <header className="workspace-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="sidebar-collapse-btn"
          onClick={onOpenMobile}
          style={{ display: 'none' }}
          id="mobile-nav-toggle"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
          <span style={{ color: 'var(--border-subtle)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getBreadcrumb()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Global Search shortcut button */}
        <button className="global-search-trigger" onClick={onOpenSearch} title="Search workspace (⌘K)">
          <Search size={14} color="var(--text-muted)" />
          <span>Search projects...</span>
          <span className="search-kbd">⌘K</span>
        </button>

        {/* Quick Add Project action */}
        {location.pathname !== '/projects/new' && (
          <Link to="/projects/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> <span>New</span>
          </Link>
        )}
      </div>

      <style>{`
        @media (max-width: 992px) {
          #mobile-nav-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
