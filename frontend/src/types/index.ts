export type ProjectStatus = 'In Development' | 'Completed' | 'Incomplete' | 'Archived' | 'Planning';

export type ProjectCategory =
  | 'Web Application'
  | 'Machine Learning / Edge AI'
  | 'Data Science & Analytics'
  | 'Backend API'
  | 'Jupyter Notebook'
  | 'Developer Tool'
  | 'Other';

export type ProvenanceType = 'detected' | 'inferred' | 'missing' | 'needs_review';

export interface ProvenanceItem<T = any> {
  value: T;
  provenance: ProvenanceType;
  source?: string | null;
  confidence: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repository_url?: string | null;
  repository_owner?: string | null;
  repository_name?: string | null;
  deployment_url?: string | null;
  status: ProjectStatus;
  project_type: ProjectCategory;
  primary_language?: string | null;
  languages?: Record<string, number>;
  frontend_framework?: string | null;
  backend_framework?: string | null;
  database_technology?: string | null;
  technologies: string[];
  readme_summary?: string | null;
  notebook_urls: string[];
  dependency_manifests?: Record<string, string[]>;
  entry_points?: Record<string, string>;
  project_notes?: string | null;
  repository_analysis_metadata?: any;
  analysis_timestamp?: string | null;
  local_path?: string | null;
  local_status: 'idle' | 'starting' | 'running' | 'stopped' | 'failed';
  local_port_frontend?: number | null;
  local_port_backend?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TechnologyCount {
  name: string;
  count: number;
}

export interface DashboardStats {
  total_projects: number;
  deployed_projects: number;
  completed_projects: number;
  in_development_projects: number;
  incomplete_projects: number;
  archived_projects: number;
  planning_projects: number;
  top_technologies: TechnologyCount[];
  recent_projects: Project[];
}

export interface GitHubAnalysisResult {
  repository_name: ProvenanceItem<string>;
  repository_owner: ProvenanceItem<string>;
  repository_url: ProvenanceItem<string>;
  description: ProvenanceItem<string>;
  readme_summary: ProvenanceItem<string>;
  primary_language: ProvenanceItem<string | null>;
  languages: ProvenanceItem<Record<string, number>>;
  project_category: ProvenanceItem<ProjectCategory>;
  frontend_framework: ProvenanceItem<string | null>;
  backend_framework: ProvenanceItem<string | null>;
  database_technology: ProvenanceItem<string | null>;
  technologies: ProvenanceItem<string[]>;
  dependency_manifests: ProvenanceItem<Record<string, string[]>>;
  entry_points: ProvenanceItem<Record<string, string>>;
  notebook_urls: ProvenanceItem<string[]>;
  docker_support: ProvenanceItem<boolean>;
  ci_workflows: ProvenanceItem<string[]>;
  default_branch: ProvenanceItem<string>;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  license?: string | null;
  homepage?: string | null;
  is_fork: boolean;
  created_at?: string;
  updated_at?: string;
  directory_tree_sample: string[];
  key_features?: ProvenanceItem<string[]> | null;
  limitations?: string[];
  evidence_references?: string[];
}

export interface GitHubAnalyzeResponse {
  success: boolean;
  data?: GitHubAnalysisResult;
  error?: string;
  is_duplicate: boolean;
  existing_project_id?: string | null;
}

export interface AgentTask {
  id: string;
  project_id?: string | null;
  instruction: string;
  task_type: string;
  status: string;
  result?: any;
  error_details?: string | null;
  execution_log?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface AgentTaskListResponse {
  items: AgentTask[];
  total: number;
}

export interface AgentInstructionResponse {
  task_id: string;
  intent: string;
  response_message: string;
  requires_approval: boolean;
  proposed_changes?: Record<string, any>;
  action_result?: any;
  status: string;
  error?: string | null;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  message_order: number;
  metadata_json?: Record<string, any> | null;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  project_id?: string | null;
  is_archived: boolean;
  metadata_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string | null;
}

export interface ConversationDetail {
  id: string;
  title: string;
  project_id?: string | null;
  is_archived: boolean;
  metadata_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
}

export interface ConversationListResponse {
  items: ConversationItem[];
  total: number;
}

export interface SendMessageResponse {
  user_message: MessageItem;
  assistant_message: MessageItem;
  agent_response: AgentInstructionResponse;
}

export interface ComponentHealth {
  status: 'connected' | 'unavailable' | 'disabled' | 'not_configured';
  details: string;
}

export interface SettingsHealthResponse {
  status: string;
  timestamp: string;
  services: Record<string, ComponentHealth>;
}

export interface RunStatusResponse {
  status: string;
  target_dir?: string;
  backend_port?: number | null;
  frontend_port?: number | null;
  frontend_url?: string | null;
  backend_url?: string | null;
  started_at?: string;
  error?: string | null;
  logs: string;
}
