import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bot,
  FolderGit2,
  LayoutDashboard,
  PlusCircle,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">
        <Layers size={22} color="var(--accent-primary)" />
        <span>Project Manager</span>
        <span className="nav-brand-badge">AI Platform</span>
      </NavLink>

      <div className="nav-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FolderGit2 size={16} />
          <span>All Projects</span>
        </NavLink>

        <NavLink
          to="/projects/new"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={16} />
          <span>Add Project</span>
        </NavLink>

        <NavLink
          to="/agent"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Bot size={16} />
          <span>AI Agent</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Activity size={16} />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};
