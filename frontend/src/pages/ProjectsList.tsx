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

  // Filters state from URL or default
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

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">All Projects</h1>
          <p className="page-subtitle">
            Explore, filter, run locally, and showcase every repository in your catalog.
          </p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <Plus size={16} /> Add Project
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
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
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search projects by name, description, technologies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchInput('');
                updateParam('search', '');
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Filters Row */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} /> Filter:
          </div>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px', fontSize: '0.85rem' }}
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

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '170px', fontSize: '0.85rem' }}
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

          {/* Sort By */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.85rem' }}
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
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid-cards">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div className="grid-cards">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
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
                marginTop: '2.5rem',
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
                Page {page} of {totalPages} ({total} projects)
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
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            borderStyle: 'dashed',
          }}
        >
          <FolderGit2
            size={40}
            color="var(--text-muted)"
            style={{ margin: '0 auto 1rem auto' }}
          />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No matching projects found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Try adjusting your search terms or filters to find what you are looking for.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchInput('');
              setSearchParams(new URLSearchParams());
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
