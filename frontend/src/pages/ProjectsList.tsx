import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { CardSkeleton } from '../components/LoadingSkeleton';

export const ProjectsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'All';
  const category = searchParams.get('category') || 'All';
  const technology = searchParams.get('technology') || 'All';
  const sortBy = searchParams.get('sort_by') || 'updated_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects({
        page,
        page_size: 12,
        search: search || undefined,
        status: status !== 'All' ? status : undefined,
        category: category !== 'All' ? category : undefined,
        technology: technology !== 'All' ? technology : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setProjects(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search, status, category, technology, sortBy, sortOrder]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'All') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const hasActiveFilters = search || status !== 'All' || category !== 'All' || technology !== 'All';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace Repositories</h1>
          <p className="page-subtitle">
            Catalog of {total} applications, edge AI pipelines, and service backends.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Grid / List view toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                background: viewMode === 'grid' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--secondary-accent)' : 'var(--text-muted)',
              }}
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                background: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--secondary-accent)' : 'var(--text-muted)',
              }}
              title="List View"
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>

          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={16} /> Add Project
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="aurora-card"
        style={{
          marginBottom: '2rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search projects by title, framework (FastAPI, React), or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '42px', height: '42px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchInput('');
                updateParam('search', '');
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} color="var(--secondary-accent)" /> Filter by:
          </div>

          {/* Status Dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px', fontSize: '0.85rem', height: '36px', padding: '0 0.75rem' }}
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="In Development">In Development</option>
            <option value="Completed">Completed</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Planning">Planning</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Category Dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '170px', fontSize: '0.85rem', height: '36px', padding: '0 0.75rem' }}
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Web Application">Web Application</option>
            <option value="Machine Learning / Edge AI">Machine Learning / Edge AI</option>
            <option value="Data Science & Analytics">Data Science & Analytics</option>
            <option value="Backend API">Backend API</option>
            <option value="Jupyter Notebook">Jupyter Notebook</option>
            <option value="Other">Other</option>
          </select>

          {/* Sort By Dropdown */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.85rem', height: '36px', padding: '0 0.75rem' }}
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                const next = new URLSearchParams(searchParams);
                next.set('sort_by', sb);
                next.set('sort_order', so);
                setSearchParams(next);
              }}
            >
              <option value="updated_at:desc">Recently Updated</option>
              <option value="created_at:desc">Newest First</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active filters:</span>
            {search && (
              <span className="badge badge-provenance-inferred" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Query: "{search}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('search', '')} />
              </span>
            )}
            {status !== 'All' && (
              <span className="badge badge-provenance-inferred" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Status: {status}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('status', 'All')} />
              </span>
            )}
            {category !== 'All' && (
              <span className="badge badge-provenance-inferred" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Category: {category}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('category', 'All')} />
              </span>
            )}
            {technology !== 'All' && (
              <span className="badge badge-provenance-inferred" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Tech: {technology}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateParam('technology', 'All')} />
              </span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={clearAllFilters}
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid or List */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '1.25rem' }}>
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '1.25rem' }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                layout={viewMode}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '3rem',
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', (page - 1).toString());
                  setSearchParams(next);
                }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages} ({total} repositories)
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', (page + 1).toString());
                  setSearchParams(next);
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div
          className="aurora-card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            borderStyle: 'dashed',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--text-muted)',
            }}
          >
            <FolderGit2 size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No repositories matched criteria
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Try modifying your query or resetting active filters to browse the catalog.
          </p>
          <button className="btn btn-secondary" onClick={clearAllFilters}>
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
