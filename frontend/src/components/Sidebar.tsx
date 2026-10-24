import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  PlusCircle,
  Cpu,
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
    { to: '/', label: 'Dashboard', index: '01', icon: LayoutDashboard },
    { to: '/projects', label: 'All Projects', index: '02', icon: FolderGit2 },
    { to: '/projects/new', label: 'Add Project', index: '03', icon: PlusCircle },
    { to: '/agent', label: 'AI Workspace', index: '04', icon: Cpu },
    { to: '/settings', label: 'Settings', index: '05', icon: Settings },
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
          <div className="observatory-glyph" title="Kinetic Observatory">
            KO
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                OBSERVATORY
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                DEV WORKSPACE
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="btn-icon"
            style={{ color: 'var(--text-muted)' }}
            title="Collapse Rail (⌘B)"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Rail */}
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
                gap: '0.65rem',
                padding: collapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '3px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-structural)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.82rem',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {item.index}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer & Telemetry Status */}
      <div
        style={{
          padding: '0.85rem 0.75rem',
          borderTop: '1px solid var(--border-structural)',
          backgroundColor: 'var(--bg-surface-recessed)',
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={onToggle} className="btn-icon" title="Expand Rail">
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Database size={13} color="var(--text-muted)" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>POSTGRES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {backendStatus === 'connected' ? (
                <>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.68rem' }}>ONLINE</span>
                </>
              ) : (
                <>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                  <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.68rem' }}>OFFLINE</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
