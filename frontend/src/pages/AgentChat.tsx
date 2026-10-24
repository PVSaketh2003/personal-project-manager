import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  Clock,
  Code2,
  CornerDownLeft,
  Cpu,
  Layers,
  Loader2,
  Mic,
} from 'lucide-react';
import { api } from '../api/client';
import { AgentInstructionResponse, AgentTask, Project } from '../types';

interface WorkflowMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  intent?: string;
  actionResult?: any;
  requiresApproval?: boolean;
  proposedChanges?: any;
  status?: string;
  timestamp: string;
  executionTimeMs?: number;
}

export const AgentChat: React.FC = () => {
  const [instruction, setInstruction] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWorkflowNode, setActiveWorkflowNode] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [voiceNotice, setVoiceNotice] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<AgentTask | null>(null);

  const loadTaskHistory = useCallback(async () => {
    try {
      const res = await api.getAgentTasks(15);
      setTasks(res.items);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  useEffect(() => {
    // Load projects for dropdown selector
    api.getProjects({ page_size: 50 }).then((res) => {
      setProjects(res.items);
    }).catch(console.error);

    // Load recent agent tasks
    loadTaskHistory();

    // Default welcome workflow log
    setMessages([
      {
        id: 'init-msg',
        sender: 'agent',
        text: 'LangGraph autonomous workflow agent initialized in deterministic fallback mode. Ready to process typed state graphs, query project catalogs, retrieve AST dependency manifests, execute localhost test runs, or apply safe database mutations.',
        status: 'completed',
        intent: 'system_init',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [loadTaskHistory]);

  const handleSend = async (confirmAction: boolean = false, prefillMsg?: string) => {
    const query = prefillMsg || instruction;
    if (!query.trim() && !confirmAction) return;

    const startTime = Date.now();
    const userMsg: WorkflowMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: confirmAction ? 'Confirmed: Approve and execute state changes.' : query,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (!confirmAction) {
      setMessages((prev) => [...prev, userMsg]);
      setInstruction('');
    }

    setLoading(true);
    setActiveWorkflowNode('parse_intent');

    // Simulate node transition animation
    const timer1 = setTimeout(() => setActiveWorkflowNode('retrieve_context'), 350);
    const timer2 = setTimeout(() => setActiveWorkflowNode('execute_action'), 700);

    try {
      const res: AgentInstructionResponse = await api.executeAgentInstruction({
        instruction: query,
        project_id: selectedProjectId || null,
        is_confirmed: confirmAction,
      });

      const elapsed = Date.now() - startTime;
      setActiveWorkflowNode('format_output');

      const agentMsg: WorkflowMessage = {
        id: res.task_id,
        sender: 'agent',
        text: res.response_message,
        intent: res.intent,
        actionResult: res.action_result,
        requiresApproval: res.requires_approval,
        proposedChanges: res.proposed_changes,
        status: res.status,
        timestamp: new Date().toLocaleTimeString(),
        executionTimeMs: elapsed,
      };

      setMessages((prev) => [...prev, agentMsg]);
      loadTaskHistory();
    } catch (err: any) {
      const errMsg: WorkflowMessage = {
        id: String(Date.now()),
        sender: 'agent',
        text: `Execution failed: ${err.message || 'Workflow graph execution error.'}`,
        status: 'failed',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setActiveWorkflowNode(null);
    }
  };

  const handleShortcutClick = (query: string) => {
    setInstruction(query);
  };

  const handleMicClick = () => {
    setVoiceNotice(true);
    setTimeout(() => setVoiceNotice(false), 3500);
  };

  const workflowNodes = [
    { id: 'parse_intent', label: '1. Intent Classifier' },
    { id: 'retrieve_context', label: '2. Context Retrieval' },
    { id: 'execute_action', label: '3. Action & Safety Gate' },
    { id: 'format_output', label: '4. State Output' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(72, 221, 245, 0.12)', border: '1px solid rgba(72, 221, 245, 0.28)', color: 'var(--accent-secondary)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            <Cpu size={12} /> STATEGRAPH COMMAND ENGINE
          </div>
          <h1 className="page-title">AI Agent Command Center</h1>
          <p className="page-subtitle">
            Autonomous LangGraph execution engine with typed state transitions, project context routing, and PostgreSQL safety gates.
          </p>
        </div>

        {/* Engine Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
          <div style={{ fontSize: '0.78rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Engine: Rule-Based & LangGraph</div>
            <div style={{ color: 'var(--text-muted)' }}>Deterministic fallback operational</div>
          </div>
        </div>
      </div>

      {/* Workflow Pipeline Nodes Visualizer */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Activity size={15} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600 }}>Graph Pipeline:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {workflowNodes.map((node, idx) => {
            const isActive = activeWorkflowNode === node.id;
            return (
              <React.Fragment key={node.id}>
                <div
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: isActive ? 'rgba(72, 221, 245, 0.2)' : 'var(--bg-elevated)',
                    color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)',
                    border: isActive ? '1px solid var(--accent-secondary)' : '1px solid var(--border-subtle)',
                    boxShadow: isActive ? 'var(--shadow-glow-cyan)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {isActive && <Loader2 size={11} className="spin" />}
                  {node.label}
                </div>
                {idx < workflowNodes.length - 1 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Command Console & Audit Log Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Command Center Console */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '660px',
            padding: '1.25rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Target Project Context Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <Layers size={14} color="var(--accent-primary)" />
              <span>Project Scope:</span>
            </div>
            <select
              className="form-select"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', flex: 1 }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Global Context (All Catalog Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.status} - {p.project_type}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Suggested Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px dashed var(--border-subtle)',
            }}
          >
            {[
              { label: '🔍 Find Computer Vision', query: 'Find all computer vision projects' },
              { label: '📊 Summarize Catalog', query: 'Summarize my active engineering projects' },
              { label: '📦 Inspect Manifests', query: 'Inspect manifests for In-out-Project-' },
              { label: '🚀 Test Runner', query: 'Launch project on localhost' },
              { label: '✅ Mark Completed', query: 'Mark this project as Completed' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="badge"
                style={{
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleShortcutClick(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Console Execution Stream */}
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
                  flexDirection: 'column',
                  gap: '0.35rem',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: m.sender === 'user' ? '80%' : '95%',
                  width: m.sender === 'agent' ? '100%' : 'auto',
                }}
              >
                {/* User Prompt */}
                {m.sender === 'user' ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 124, 255, 0.25) 0%, rgba(72, 221, 245, 0.2) 100%)',
                      border: '1px solid rgba(139, 124, 255, 0.4)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <span style={{ color: 'var(--accent-secondary)', marginRight: '6px' }}>❯</span>
                    {m.text}
                  </div>
                ) : (
                  /* Agent Execution Card */
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.15rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {/* Agent Run Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            background: 'rgba(139, 124, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          <Bot size={14} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          LangGraph StateGraph Runner
                        </span>
                        {m.intent && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              background: 'var(--bg-elevated)',
                              borderRadius: '4px',
                              color: 'var(--accent-secondary)',
                              border: '1px solid rgba(72, 221, 245, 0.2)',
                            }}
                          >
                            node:{m.intent}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        {m.executionTimeMs && <span>{m.executionTimeMs}ms</span>}
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>
                    </div>

                    {/* Result Content */}
                    <div
                      style={{
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.text}
                    </div>

                    {/* Safety Gate Explicit Approval Banner */}
                    {m.requiresApproval && m.proposedChanges && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '0.85rem 1rem',
                          background: 'rgba(245, 197, 107, 0.1)',
                          border: '1px solid rgba(245, 197, 107, 0.35)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.4rem' }}>
                          <AlertTriangle size={15} /> Safety Gate: Database Mutation Requires Explicit Confirmation
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                          Target project state change: <code style={{ color: 'var(--accent-highlight)' }}>{JSON.stringify(m.proposedChanges)}</code>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSend(true, `Apply changes: ${JSON.stringify(m.proposedChanges)}`)}
                          disabled={loading}
                          style={{
                            background: 'var(--warning)',
                            color: '#0B1020',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} /> Confirm & Apply to PostgreSQL
                        </button>
                      </div>
                    )}

                    {/* Action Result / Artifact Payload Preview (if present) */}
                    {m.actionResult && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          overflowX: 'auto',
                        }}
                      >
                        <div style={{ color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.7rem' }}>
                          RETURNED STATE PAYLOAD:
                        </div>
                        <pre style={{ margin: 0 }}>
                          {typeof m.actionResult === 'string'
                            ? m.actionResult
                            : JSON.stringify(m.actionResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Active Loading Animation */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(72, 221, 245, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  width: 'fit-content',
                  color: 'var(--accent-secondary)',
                  fontSize: '0.82rem',
                }}
              >
                <Loader2 size={16} className="spin" />
                <span>Executing LangGraph workflow node ({activeWorkflowNode || 'processing'})...</span>
              </div>
            )}
          </div>

          {/* Voice Input Notice */}
          {voiceNotice && (
            <div
              style={{
                padding: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--accent-secondary)',
                textAlign: 'center',
                background: 'rgba(72, 221, 245, 0.08)',
                border: '1px solid rgba(72, 221, 245, 0.2)',
                borderRadius: 'var(--radius-sm)',
                margin: '0.5rem 0',
              }}
            >
              🎙️ Voice command recognition is marked as a planned future capability in this phase.
            </div>
          )}

          {/* Console Command Input Bar */}
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
              title="Voice Input (Planned capability)"
              style={{ padding: '0.65rem', color: 'var(--text-muted)' }}
            >
              <Mic size={17} />
            </button>

            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  paddingRight: '2.5rem',
                }}
                placeholder="Type command instruction (e.g. 'Summarize In-out-Project-', 'Find all FastAPI apps')..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={loading}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  pointerEvents: 'none',
                }}
              >
                ↵ Enter
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !instruction.trim()}
              style={{
                padding: '0.65rem 1.25rem',
                boxShadow: 'var(--shadow-glow-cyan)',
              }}
            >
              <CornerDownLeft size={16} /> Execute
            </button>
          </form>
        </div>

        {/* Task Execution Audit History Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card"
            style={{
              height: '420px',
              overflowY: 'auto',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Execution Audit Log</h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {tasks.length} runs
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskDetail(t)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.instruction}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{t.task_type}</span>
                    <span
                      style={{
                        color: t.status === 'completed' ? 'var(--success)' : t.status === 'needs_approval' ? 'var(--warning)' : 'var(--danger)',
                        fontWeight: 600,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '2.5rem 0' }}>
                  No execution tasks logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Selected Task Details Inspector Modal/Card */}
          {selectedTaskDetail && (
            <div className="card" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--accent-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  Task Run #{selectedTaskDetail.id.slice(0, 8)}
                </span>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 500 }}>
                {selectedTaskDetail.instruction}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Type:</strong> {selectedTaskDetail.task_type}</div>
                <div><strong>Status:</strong> <span style={{ color: selectedTaskDetail.status === 'completed' ? 'var(--success)' : 'var(--danger)' }}>{selectedTaskDetail.status}</span></div>
                {selectedTaskDetail.error_details && (
                  <div style={{ color: 'var(--danger)' }}><strong>Error:</strong> {selectedTaskDetail.error_details}</div>
                )}
                <div><strong>Timestamp:</strong> {new Date(selectedTaskDetail.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Engine Capability Matrix Card */}
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Code2 size={14} color="var(--accent-secondary)" /> Deterministic Capabilities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>• Keyword & semantic project filtering</div>
              <div>• AST manifest parsing (package.json, pyproject)</div>
              <div>• Safe project status transitions</div>
              <div>• Localhost subprocess management</div>
              <div>• PostgreSQL persistence logging</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
