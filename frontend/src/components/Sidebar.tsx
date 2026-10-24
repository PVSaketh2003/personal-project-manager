import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  PlusCircle,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { api } from '../api/client';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('connected');

  useEffect(() => {
    api.getSettingsHealth()
      .then((data) => {
        const isPgOk = data?.services?.postgresql?.status === 'connected';
        setBackendStatus(isPgOk ? 'connected' : 'disconnected');
      })
      .catch(() => setBackendStatus('disconnected'));
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'All Projects', icon: FolderGit2 },
    { to: '/projects/new', label: 'Add Project', icon: PlusCircle },
    { to: '/agent', label: 'AI Assistant', icon: Bot },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`observatory-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-structural)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="observatory-glyph" title="Project Manager">
            PM
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                Project Manager
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Developer Workspace
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="btn-icon"
            style={{ color: 'var(--text-muted)' }}
            title="Collapse Sidebar (⌘B)"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '0.85rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.65rem 0' : '0.6rem 0.85rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '4px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-structural)' : '1px solid transparent',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.84rem',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={16} style={{ flexShrink: 0, color: 'inherit' }} />
              {!collapsed && (
                <span style={{ flex: 1 }}>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Database Connection Status Footer */}
      <div
        style={{
          padding: '0.85rem 0.85rem',
          borderTop: '1px solid var(--border-structural)',
          backgroundColor: 'var(--bg-surface-recessed)',
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={onToggle} className="btn-icon" title="Expand Sidebar">
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)' }}>
              <Database size={13} />
              <span>PostgreSQL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: backendStatus === 'connected' ? 'var(--success)' : 'var(--danger)',
                }}
              />
              <span style={{ color: backendStatus === 'connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.7rem' }}>
                {backendStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
