import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderGit2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { Project } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!query.trim()) {
        try {
          const res = await api.getProjects({ page_size: 6 });
          setResults(res.items);
        } catch {
          setResults([]);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await api.getProjects({ search: query.trim(), page_size: 8 });
        setResults(res.items);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

  // Handle keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrap">
          <Search size={18} color="var(--secondary-accent)" />
          <input
            type="text"
            className="command-palette-input"
            placeholder="Search projects, technologies (FastAPI, React), or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="command-palette-list">
          <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {query ? 'Search Results' : 'Recent Projects'}
          </div>

          {loading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Searching workspace...
            </div>
          ) : results.length > 0 ? (
            results.map((p) => (
              <div
                key={p.id}
                className="command-palette-item"
                onClick={() => {
                  navigate(`/projects/${p.id}`);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FolderGit2 size={16} color="var(--primary-accent)" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.project_type} • {p.status}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary-accent)' }}>
                    {p.primary_language || 'Repo'}
                  </span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No projects found matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
