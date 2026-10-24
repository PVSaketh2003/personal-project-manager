import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AddProject } from '../pages/AddProject';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    analyzeGitHubRepo: vi.fn(),
    createProject: vi.fn(),
  },
}));

describe('AddProject Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows automatic GitHub extraction and auto-fills fields', async () => {
    vi.mocked(api.analyzeGitHubRepo).mockResolvedValue({
      success: true,
      is_duplicate: false,
      data: {
        repository_name: { value: 'In-out-Project-', provenance: 'detected', confidence: 1.0 },
        repository_owner: { value: 'PVSaketh2003', provenance: 'detected', confidence: 1.0 },
        repository_url: { value: 'https://github.com/PVSaketh2003/In-out-Project-', provenance: 'detected', confidence: 1.0 },
        description: { value: 'In-out people counter with OpenCV and Jetson', provenance: 'detected', confidence: 1.0 },
        readme_summary: { value: 'High precision edge vision model', provenance: 'detected', confidence: 1.0 },
        primary_language: { value: 'Python', provenance: 'detected', confidence: 1.0 },
        languages: { value: { Python: 50000 }, provenance: 'detected', confidence: 1.0 },
        project_category: { value: 'Machine Learning / Edge AI', provenance: 'detected', confidence: 1.0 },
        frontend_framework: { value: null, provenance: 'missing', confidence: 1.0 },
        backend_framework: { value: 'FastAPI', provenance: 'detected', confidence: 1.0 },
        database_technology: { value: 'SQLite', provenance: 'detected', confidence: 1.0 },
        technologies: { value: ['Python', 'OpenCV', 'FastAPI'], provenance: 'detected', confidence: 1.0 },
        dependency_manifests: { value: {}, provenance: 'missing', confidence: 1.0 },
        entry_points: { value: { backend: 'main.py' }, provenance: 'detected', confidence: 1.0 },
        notebook_urls: { value: [], provenance: 'missing', confidence: 1.0 },
        docker_support: { value: true, provenance: 'detected', confidence: 1.0 },
        ci_workflows: { value: [], provenance: 'missing', confidence: 1.0 },
        default_branch: { value: 'main', provenance: 'detected', confidence: 1.0 },
        stars_count: 5,
        forks_count: 1,
        open_issues_count: 0,
        is_fork: false,
        directory_tree_sample: ['main.py', 'requirements.txt'],
      },
    });

    render(
      <BrowserRouter>
        <AddProject />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/In-out-Project-/i);
    fireEvent.change(input, { target: { value: 'https://github.com/PVSaketh2003/In-out-Project-' } });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze Repository/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(api.analyzeGitHubRepo).toHaveBeenCalledWith('https://github.com/PVSaketh2003/In-out-Project-');
      const nameInput = screen.getByDisplayValue('In-out-Project-');
      expect(nameInput).toBeInTheDocument();
      expect(screen.getByDisplayValue('FastAPI')).toBeInTheDocument();
    });
  });
});
