import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    getDashboardStats: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard statistics and recent projects when loaded', async () => {
    vi.mocked(api.getDashboardStats).mockResolvedValue({
      total_projects: 5,
      deployed_projects: 2,
      completed_projects: 3,
      in_development_projects: 2,
      incomplete_projects: 0,
      archived_projects: 0,
      planning_projects: 0,
      top_technologies: [{ name: 'FastAPI', count: 3 }],
      recent_projects: [
        {
          id: 'proj-1',
          name: 'Edge AI Detection',
          description: 'YOLO Jetson pipeline',
          status: 'Completed',
          project_type: 'Machine Learning / Edge AI',
          technologies: ['Python', 'FastAPI', 'PyTorch'],
          notebook_urls: [],
          local_status: 'idle',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your projects, in one workspace.')).toBeInTheDocument();
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Edge AI Detection')).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    vi.mocked(api.getDashboardStats).mockRejectedValue(new Error('Network error connecting to backend'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error connecting to backend/i)).toBeInTheDocument();
    });
  });
});
