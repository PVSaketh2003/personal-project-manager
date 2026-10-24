import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { Project } from '../types';

describe('ProjectCard Component', () => {
  const mockProject: Project = {
    id: 'test-123',
    name: 'Smart Traffic Controller',
    description: 'Edge computer vision traffic light optimizer',
    repository_url: 'https://github.com/PVSaketh2003/smart-traffic',
    deployment_url: 'https://traffic.demo.in',
    status: 'In Development',
    project_type: 'Machine Learning / Edge AI',
    primary_language: 'Python',
    technologies: ['Python', 'OpenCV', 'YOLO'],
    notebook_urls: [],
    local_status: 'idle',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('renders project details, links, and triggers delete dialog', () => {
    const onDelete = vi.fn();

    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} onDelete={onDelete} />
      </BrowserRouter>
    );

    expect(screen.getByText('Smart Traffic Controller')).toBeInTheDocument();
    expect(screen.getByText('In Development')).toBeInTheDocument();
    expect(screen.getByTitle(/Live Deployment/i)).toBeInTheDocument();

    const deleteBtn = screen.getByTitle(/Delete project/i);
    fireEvent.click(deleteBtn);

    // Confirm dialog should appear
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument();
  });
});
