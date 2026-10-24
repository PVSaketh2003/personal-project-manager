import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Clock,
  Mic,
  Send,
  User,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { AgentInstructionResponse, AgentTask, Project } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  intent?: string;
  actionResult?: any;
  requiresApproval?: boolean;
  proposedChanges?: any;
  status?: string;
  timestamp: string;
}

export const AgentChat: React.FC = () => {
  const [instruction, setInstruction] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [voiceNotice, setVoiceNotice] = useState(false);

  const loadTaskHistory = useCallback(async () => {
    try {
      const res = await api.getAgentTasks(15);
      setTasks(res.items);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  useEffect(() => {
    // Load projects for selector
    api.getProjects({ page_size: 50 }).then((res) => {
      setProjects(res.items);
    }).catch(console.error);

    // Load recent agent tasks
    loadTaskHistory();

    // Default greeting message
    setMessages([
      {
        id: 'init-msg',
        sender: 'agent',
        text: 'Hello! I am your Project Manager AI assistant powered by LangGraph. You can ask me to search repositories ("Find all computer vision projects"), summarize an existing project, inspect manifests, update project statuses, or launch localhost development servers.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [loadTaskHistory]);

  const handleSend = async (confirmAction: boolean = false, prefillMsg?: string) => {
    const query = prefillMsg || instruction;
    if (!query.trim() && !confirmAction) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: confirmAction ? 'Confirmed: Apply proposed changes.' : query,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (!confirmAction) {
      setMessages((prev) => [...prev, userMsg]);
      setInstruction('');
    }

    setLoading(true);

    try {
      const res: AgentInstructionResponse = await api.executeAgentInstruction({
        instruction: query,
        project_id: selectedProjectId || null,
        is_confirmed: confirmAction,
      });

      const agentMsg: ChatMessage = {
        id: res.task_id,
        sender: 'agent',
        text: res.response_message,
        intent: res.intent,
        actionResult: res.action_result,
        requiresApproval: res.requires_approval,
        proposedChanges: res.proposed_changes,
        status: res.status,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentMsg]);
      loadTaskHistory();
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'agent',
        text: `Error executing task: ${err.message || 'Workflow error'}`,
        status: 'failed',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicClick = () => {
    setVoiceNotice(true);
    setTimeout(() => setVoiceNotice(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">LangGraph AI Assistant</h1>
          <p className="page-subtitle">
            Autonomous agent workflow with typed state, project context retrieval, and safety approvals.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chat Window */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '1.25rem' }}>
          {/* Project Context Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Target Project:</span>
            <select
              className="form-select"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem', flex: 1 }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">All Projects (Global Context)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingRight: '0.5rem',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {m.sender === 'agent' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      background:
                        m.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      border:
                        m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {m.text}

                    {/* Explicit Confirmation Dialog within message */}
                    {m.requiresApproval && m.proposedChanges && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          padding: '0.75rem',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ fontSize: '0.82rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                          ⚠️ Explicit confirmation required to mutate PostgreSQL database:
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSend(true, `Apply changes: ${JSON.stringify(m.proposedChanges)}`)}
                          disabled={loading}
                        >
                          <Check size={14} /> Confirm & Apply Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.25rem',
                      textAlign: m.sender === 'user' ? 'right' : 'left',
                    }}
                  >
                    {m.intent && <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>[{m.intent}]</span>}
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Voice Input Notice */}
          {voiceNotice && (
            <div
              style={{
                padding: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--info)',
                textAlign: 'center',
                background: 'var(--info-bg)',
                borderRadius: 'var(--radius-sm)',
                margin: '0.5rem 0',
              }}
            >
              🎙️ Voice input is marked as a future capability in this phase.
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleMicClick}
              title="Voice Input (Future capability)"
              style={{ padding: '0.65rem' }}
            >
              <Mic size={18} color="var(--text-muted)" />
            </button>

            <input
              type="text"
              className="form-input"
              placeholder="Ask anything (e.g. 'Summarize project In-out-Project-', 'Find all FastAPI apps')..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !instruction.trim()}
              style={{ padding: '0.65rem 1rem' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Task Audit History Sidebar */}
        <div className="card" style={{ height: '620px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Task Execution Audit</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {t.instruction}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  <span>{t.task_type}</span>
                  <span style={{ color: t.status === 'completed' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>
                No past tasks logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
