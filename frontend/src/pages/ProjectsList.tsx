import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { Project, ProjectCategory, ProjectStatus } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { CardSkeleton } from '../components/LoadingSkeleton';

export const ProjectsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Layout switcher: 'grid' | 'list'
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  // Filters from query params or state
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as ProjectStatus) || '';
  const category = (searchParams.get('category') as ProjectCategory) || '';
  const technology = searchParams.get('technology') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sort_by') || 'updated_at';

  const [searchInput, setSearchInput] = useState(search);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({
        page,
        page_size: 12,
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        technology: technology || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
      });
      setProjects(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchParams]);

  const updateParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || null);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(search || status || category || technology);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
            All Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            {total} {total === 1 ? 'repository' : 'repositories'} cataloged in your workspace.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          {/* Grid / List Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-structural)',
              borderRadius: '3px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setLayout('grid')}
              style={{
                padding: '0.4rem 0.65rem',
                backgroundColor: layout === 'grid' ? 'var(--bg-surface-elevated)' : 'transparent',
                border: layout === 'grid' ? '1px solid var(--border-structural)' : '1px solid transparent',
                borderRadius: '2px',
                color: layout === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setLayout('list')}
              style={{
                padding: '0.4rem 0.65rem',
                backgroundColor: layout === 'list' ? 'var(--bg-surface-elevated)' : 'transparent',
                border: layout === 'list' ? '1px solid var(--border-structural)' : '1px solid transparent',
                borderRadius: '2px',
                color: layout === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>

          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={15} /> Ingest Project
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="obs-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
              placeholder="Search by title, stack (FastAPI, React), or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        {/* Status Dropdown */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="form-select"
            style={{ height: '36px', fontSize: '0.82rem' }}
            value={status}
            onChange={(e) => updateParam('status', e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Development">In Development</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Planning">Planning</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            style={{ height: '36px', fontSize: '0.82rem' }}
            value={category}
            onChange={(e) => updateParam('category', e.target.value || null)}
          >
            <option value="">All Categories</option>
            <option value="Web Application">Web Application</option>
            <option value="Machine Learning / Edge AI">Machine Learning / Edge AI</option>
            <option value="Data Science & Analytics">Data Science & Analytics</option>
            <option value="Backend API">Backend API</option>
            <option value="Jupyter Notebook">Jupyter Notebook</option>
            <option value="Developer Tool">Developer Tool</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Sort */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="form-select"
            style={{ height: '36px', fontSize: '0.82rem' }}
            value={sortBy}
            onChange={(e) => updateParam('sort_by', e.target.value)}
          >
            <option value="updated_at">Sort: Last Updated</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="status">Sort: Status</option>
            <option value="created_at">Sort: Created Date</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ACTIVE FILTERS:
          </span>
          {search && (
            <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', color: 'var(--text-primary)' }}>
              Query: "{search}"
              <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => { setSearchInput(''); updateParam('search', null); }} />
            </span>
          )}
          {status && (
            <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', color: 'var(--text-primary)' }}>
              Status: {status}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => updateParam('status', null)} />
            </span>
          )}
          {category && (
            <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', color: 'var(--text-primary)' }}>
              Category: {category}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => updateParam('category', null)} />
            </span>
          )}
          {technology && (
            <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-structural)', color: 'var(--text-primary)' }}>
              Tech: {technology}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => updateParam('technology', null)} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            style={{ fontSize: '0.72rem', color: 'var(--accent-cobalt)', fontWeight: 600, marginLeft: '0.25rem', cursor: 'pointer' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Project Entries */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : projects.length > 0 ? (
        layout === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={fetchProjects} layout="grid" />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem' }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={fetchProjects} layout="list" />
            ))}
          </div>
        )
      ) : (
        <div className="obs-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <FolderGit2 size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Matching Projects Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            No project entries correspond to the active filter specifications.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={clearAllFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', (page - 1).toString())}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
            PAGE {page} OF {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', (page + 1).toString())}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
