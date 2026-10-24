import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  LayoutDashboard,
  Layers,
  PlusCircle,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { SettingsHealthResponse } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const [health, setHealth] = useState<SettingsHealthResponse | null>(null);

  useEffect(() => {
    api.getSettingsHealth().then((res) => {
      setHealth(res);
    }).catch(() => {
      setHealth(null);
    });
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/projects', label: 'All Projects', icon: FolderGit2, end: true },
    { to: '/projects/new', label: 'Add Project', icon: PlusCircle },
    { to: '/agent', label: 'AI Agent', icon: Bot },
    { to: '/settings', label: 'Settings', icon: Activity },
  ];

  const isHealthy = health?.status === 'healthy';

  return (
    <aside className={`workspace-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand" onClick={onCloseMobile}>
          <div className="brand-icon-box">
            <Layers size={18} />
          </div>
          {!collapsed && <span>Project Manager</span>}
        </NavLink>

        {/* Mobile close button / Desktop collapse toggle */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {mobileOpen ? (
            <button className="sidebar-collapse-btn" onClick={onCloseMobile} aria-label="Close menu">
              <X size={18} />
            </button>
          ) : (
            <button
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status Widget */}
      <div className="sidebar-footer">
        <NavLink to="/settings" style={{ textDecoration: 'none' }}>
          <div
            className="system-status-indicator"
            title={isHealthy ? 'Backend & PostgreSQL Connected' : 'System Degraded / Checking'}
          >
            <div className={`status-dot ${isHealthy ? '' : 'warning'}`} />
            {!collapsed && (
              <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isHealthy ? 'Backend Connected' : 'Checking Health...'}
              </span>
            )}
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
