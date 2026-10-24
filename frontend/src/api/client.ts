import {
  AgentInstructionResponse,
  AgentTaskListResponse,
  ConversationDetail,
  ConversationItem,
  ConversationListResponse,
  DashboardStats,
  GitHubAnalyzeResponse,
  Project,
  ProjectListResponse,
  RunStatusResponse,
  SendMessageResponse,
  SettingsHealthResponse,
} from '../types';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Request failed: HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Projects
  async getProjects(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    technology?: string;
    category?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.technology) query.append('technology', params.technology);
    if (params?.category) query.append('category', params.category);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);

    return fetchJson<ProjectListResponse>(`${BASE_URL}/projects?${query.toString()}`);
  },

  async getProject(id: string): Promise<Project> {
    return fetchJson<Project>(`${BASE_URL}/projects/${id}`);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    return fetchJson<Project>(`${BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return fetchJson<Project>(`${BASE_URL}/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string): Promise<void> {
    return fetchJson<void>(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async reanalyzeProject(id: string): Promise<Project> {
    return fetchJson<Project>(`${BASE_URL}/projects/${id}/reanalyze`, {
      method: 'POST',
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>(`${BASE_URL}/dashboard/stats`);
  },

  // GitHub Analysis
  async analyzeGitHubRepo(repoUrl: string): Promise<GitHubAnalyzeResponse> {
    return fetchJson<GitHubAnalyzeResponse>(`${BASE_URL}/github/analyze`, {
      method: 'POST',
      body: JSON.stringify({ repository_url: repoUrl }),
    });
  },

  // Local Runner (macOS Execution)
  async runProjectLocally(id: string): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/projects/${id}/run`, {
      method: 'POST',
    });
  },

  async stopProjectLocally(id: string): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/projects/${id}/stop`, {
      method: 'POST',
    });
  },

  async getRunStatus(id: string): Promise<RunStatusResponse> {
    return fetchJson<RunStatusResponse>(`${BASE_URL}/projects/${id}/run/status`);
  },

  // AI Persistent Conversations (PostgreSQL-backed)
  async getConversations(params?: {
    project_id?: string;
    include_archived?: boolean;
    limit?: number;
  }): Promise<ConversationListResponse> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id);
    if (params?.include_archived) query.append('include_archived', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    return fetchJson<ConversationListResponse>(`${BASE_URL}/agent/conversations?${query.toString()}`);
  },

  async createConversation(data: {
    title?: string;
    project_id?: string | null;
  }): Promise<ConversationDetail> {
    return fetchJson<ConversationDetail>(`${BASE_URL}/agent/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    return fetchJson<ConversationDetail>(`${BASE_URL}/agent/conversations/${id}`);
  },

  async updateConversation(
    id: string,
    data: { title?: string; project_id?: string | null; is_archived?: boolean }
  ): Promise<ConversationItem> {
    return fetchJson<ConversationItem>(`${BASE_URL}/agent/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteConversation(id: string): Promise<void> {
    return fetchJson<void>(`${BASE_URL}/agent/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async sendMessageInConversation(
    conversationId: string,
    data: { content: string; project_id?: string | null; is_confirmed?: boolean }
  ): Promise<SendMessageResponse> {
    return fetchJson<SendMessageResponse>(`${BASE_URL}/agent/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Legacy Agent Tasks & Execution
  async getAgentTasks(limit: number = 20, projectId?: string): Promise<AgentTaskListResponse> {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (projectId) query.append('project_id', projectId);
    return fetchJson<AgentTaskListResponse>(`${BASE_URL}/agent/tasks?${query.toString()}`);
  },

  async executeAgentInstruction(data: {
    instruction: string;
    project_id?: string | null;
    is_confirmed?: boolean;
  }): Promise<AgentInstructionResponse> {
    return fetchJson<AgentInstructionResponse>(`${BASE_URL}/agent/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Settings & Observability
  async getSettingsHealth(): Promise<SettingsHealthResponse> {
    return fetchJson<SettingsHealthResponse>(`${BASE_URL}/settings/health`);
  },
};
