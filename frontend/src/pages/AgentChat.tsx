import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  Clock,
  Code2,
  CornerDownLeft,
  Edit2,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import {
  AgentTask,
  ConversationDetail,
  ConversationItem,
  MessageItem,
  Project,
} from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export const AgentChat: React.FC = () => {
  // Conversations State (Persistent in PostgreSQL)
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationSearch, setConversationSearch] = useState('');

  // Chat Execution State
  const [instruction, setInstruction] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sending, setSending] = useState(false);
  const [activeWorkflowNode, setActiveWorkflowNode] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<AgentTask | null>(null);

  // Rename & Delete Modals
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<ConversationItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load project scopes
  useEffect(() => {
    api.getProjects({ page_size: 50 }).then((res) => {
      setProjects(res.items);
    }).catch(console.error);
  }, []);

  // Load recent execution tasks
  const loadTaskHistory = useCallback(async () => {
    try {
      const res = await api.getAgentTasks(10);
      setTasks(res.items);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  // Load conversation list from PostgreSQL
  const loadConversations = useCallback(async (selectIdAfterLoad?: string) => {
    setLoadingConversations(true);
    try {
      const res = await api.getConversations({ limit: 50 });
      setConversations(res.items);

      if (selectIdAfterLoad) {
        setActiveConversationId(selectIdAfterLoad);
      } else if (!activeConversationId && res.items.length > 0) {
        setActiveConversationId(res.items[0].id);
      } else if (res.items.length === 0) {
        // If no conversations exist, auto-create the initial thread
        const created = await api.createConversation({ title: 'Workspace Intelligence Session' });
        const item: ConversationItem = {
          id: created.id,
          title: created.title,
          project_id: created.project_id,
          is_archived: created.is_archived,
          metadata_json: created.metadata_json,
          created_at: created.created_at,
          updated_at: created.updated_at,
          message_count: 0,
        };
        setConversations([item]);
        setActiveConversationId(created.id);
      }
    } catch (err) {
      console.error('Failed to load persistent conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadConversations();
    loadTaskHistory();
  }, [loadConversations, loadTaskHistory]);

  // When activeConversationId changes, load full detail and messages
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    api.getConversation(activeConversationId)
      .then((detail) => {
        if (isMounted) {
          setActiveConversation(detail);
          setTimeout(scrollToBottom, 100);
        }
      })
      .catch((err) => {
        console.error('Failed to load conversation details:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

  // Create new conversation session
  const handleCreateNewConversation = async () => {
    try {
      const created = await api.createConversation({
        title: `Intelligence Session ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        project_id: selectedProjectId || null,
      });
      const item: ConversationItem = {
        id: created.id,
        title: created.title,
        project_id: created.project_id,
        is_archived: created.is_archived,
        metadata_json: created.metadata_json,
        created_at: created.created_at,
        updated_at: created.updated_at,
        message_count: 0,
      };
      setConversations((prev) => [item, ...prev]);
      setActiveConversationId(created.id);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Handle Send Message (Persisted in PostgreSQL)
  const handleSend = async (confirmAction: boolean = false, prefillMsg?: string) => {
    const query = prefillMsg || instruction;
    if (!query.trim() && !confirmAction) return;
    if (!activeConversationId) {
      const created = await api.createConversation({ title: query.slice(0, 40) });
      setActiveConversationId(created.id);
      return;
    }

    setSending(true);
    setActiveWorkflowNode('parse_intent');

    const timer1 = setTimeout(() => setActiveWorkflowNode('retrieve_context'), 350);
    const timer2 = setTimeout(() => setActiveWorkflowNode('execute_action'), 700);

    try {
      const payload = {
        content: confirmAction ? 'Confirmed: Approve and execute state changes.' : query,
        project_id: selectedProjectId || null,
        is_confirmed: confirmAction,
      };

      if (!confirmAction) {
        setInstruction('');
      }

      const res = await api.sendMessageInConversation(activeConversationId, payload);

      setActiveWorkflowNode('format_output');

      setActiveConversation((prev) => {
        if (!prev) return null;
        const filtered = prev.messages.filter((m) => m.id !== res.user_message.id);
        return {
          ...prev,
          messages: [...filtered, res.user_message, res.assistant_message],
        };
      });

      const updatedList = await api.getConversations({ limit: 50 });
      setConversations(updatedList.items);

      loadTaskHistory();
      setTimeout(scrollToBottom, 150);
    } catch (err: any) {
      console.error('Message execution failed:', err);
      if (activeConversation) {
        const fallbackMsg: MessageItem = {
          id: `err-${Date.now()}`,
          conversation_id: activeConversationId,
          role: 'assistant',
          content: `Execution error: ${err.message || 'Workflow graph execution error.'}`,
          message_order: activeConversation.messages.length + 1,
          metadata_json: { status: 'failed' },
          created_at: new Date().toISOString(),
        };
        setActiveConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, fallbackMsg] } : null));
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setSending(false);
      setActiveWorkflowNode(null);
    }
  };

  // Rename Conversation
  const handleRename = async () => {
    if (!conversationToRename || !newTitle.trim()) return;
    try {
      const updated = await api.updateConversation(conversationToRename.id, { title: newTitle.trim() });
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, title: updated.title } : c))
      );
      if (activeConversation?.id === updated.id) {
        setActiveConversation((prev) => (prev ? { ...prev, title: updated.title } : null));
      }
      setRenameModalOpen(false);
      setConversationToRename(null);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete Conversation
  const handleDelete = async () => {
    if (!conversationToDelete) return;
    try {
      await api.deleteConversation(conversationToDelete.id);
      const remaining = conversations.filter((c) => c.id !== conversationToDelete.id);
      setConversations(remaining);

      if (activeConversationId === conversationToDelete.id) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          const fresh = await api.createConversation({ title: 'New Intelligence Session' });
          const freshItem: ConversationItem = {
            id: fresh.id,
            title: fresh.title,
            project_id: fresh.project_id,
            is_archived: fresh.is_archived,
            metadata_json: fresh.metadata_json,
            created_at: fresh.created_at,
            updated_at: fresh.updated_at,
            message_count: 0,
          };
          setConversations([freshItem]);
          setActiveConversationId(fresh.id);
        }
      }
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const workflowNodes = [
    { id: 'parse_intent', label: '1. Intent Classifier' },
    { id: 'retrieve_context', label: '2. Context Retrieval' },
    { id: 'execute_action', label: '3. Action & Safety Gate' },
    { id: 'format_output', label: '4. State Persist' },
  ];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Kinetic Observatory Command Header */}
      <div className="obs-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span className="obs-tag" style={{ background: 'var(--obs-graphite)', color: 'var(--obs-chartreuse)', borderColor: 'var(--obs-border)' }}>
              OBS // PERSISTENT COGNITIVE RUNNER
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
              [STATEGRAPH 04] // PG: ACTIVE
            </span>
          </div>
          <h1 className="obs-page-title" style={{ fontSize: '1.6rem', margin: 0 }}>
            AI Workspace Intelligence Console
          </h1>
          <p className="obs-page-subtitle" style={{ margin: '0.25rem 0 0' }}>
            Permanent LangGraph session runner backed by PostgreSQL persistence. Sessions survive reboots and restarts.
          </p>
        </div>

        {/* Telemetry Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--obs-canvas)', padding: '0.5rem 0.85rem', border: '1px solid var(--obs-border)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--obs-chartreuse)', boxShadow: '0 0 8px var(--obs-chartreuse)' }} />
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontWeight: 600, color: 'var(--obs-text)' }}>MEMORY: POSTGRESQL DURABLE</div>
            <div style={{ color: 'var(--obs-muted)' }}>CHECKPOINTS: SYNCED</div>
          </div>
        </div>
      </div>

      {/* Workflow Execution Pipeline Visualizer */}
      <div className="obs-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
          <Activity size={14} color="var(--obs-cobalt)" />
          <span style={{ fontWeight: 600 }}>GRAPH PIPELINE:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {workflowNodes.map((node, idx) => {
            const isActive = activeWorkflowNode === node.id;
            return (
              <React.Fragment key={node.id}>
                <div
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    background: isActive ? 'var(--obs-graphite)' : 'var(--obs-canvas)',
                    color: isActive ? 'var(--obs-chartreuse)' : 'var(--obs-muted)',
                    border: isActive ? '1px solid var(--obs-chartreuse)' : '1px solid var(--obs-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isActive && <Loader2 size={11} className="spin" />}
                  {node.label}
                </div>
                {idx < workflowNodes.length - 1 && (
                  <span style={{ color: 'var(--obs-border)', fontSize: '0.75rem' }}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main 3-Column Layout: Sessions Sidebar | Main Chat | Execution Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Persistent Sessions Sidebar */}
        <div className="obs-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '720px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              <MessageSquare size={14} color="var(--obs-cobalt)" />
              <span>SAVED SESSIONS</span>
            </div>
            <button
              onClick={handleCreateNewConversation}
              className="obs-btn obs-btn-primary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
              title="Start a new persistent conversation thread"
            >
              <Plus size={12} /> New
            </button>
          </div>

          {/* Search Saved Sessions */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--obs-muted)' }} />
            <input
              type="text"
              placeholder="Filter sessions..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              className="obs-input"
              style={{ paddingLeft: '2rem', fontSize: '0.78rem', height: '32px' }}
            />
          </div>

          {/* Sessions List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
            {loadingConversations ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--obs-muted)', fontSize: '0.78rem' }}>
                <Loader2 size={16} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                Loading sessions from PostgreSQL...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--obs-muted)', fontSize: '0.78rem' }}>
                No saved sessions found. Click "+ New" to begin.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      background: isActive ? 'var(--obs-surface)' : 'transparent',
                      border: isActive ? '1px solid var(--obs-cobalt)' : '1px solid transparent',
                      borderLeft: isActive ? '3px solid var(--obs-cobalt)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--obs-canvas)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: isActive ? 600 : 500, fontSize: '0.8rem', color: 'var(--obs-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '175px' }}>
                        {c.title}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', opacity: isActive ? 1 : 0.6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToRename(c);
                            setNewTitle(c.title);
                            setRenameModalOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--obs-muted)', cursor: 'pointer', padding: '2px' }}
                          title="Rename session"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(c);
                            setDeleteModalOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--obs-muted)', cursor: 'pointer', padding: '2px' }}
                          title="Delete session"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.68rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>{new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span>{c.message_count ?? 0} msgs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Observatory Command Console */}
        <div className="obs-card" style={{ display: 'flex', flexDirection: 'column', height: '720px', padding: '1.25rem' }}>
          
          {/* Top Bar: Target Project Context Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--obs-border)', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              <Layers size={13} color="var(--obs-cobalt)" />
              <span>PROJECT SCOPE:</span>
            </div>
            <select
              className="obs-input"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', flex: 1, height: '34px' }}
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

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--obs-border)' }}>
            {[
              { label: '🔍 Find Computer Vision', query: 'Find all computer vision projects' },
              { label: '📊 Summarize Catalog', query: 'Summarize my active engineering projects' },
              { label: '📦 Inspect Manifests', query: 'Inspect package.json and requirements manifests' },
              { label: '🚀 Localhost Runner', query: 'Launch project on localhost runner' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="obs-tag"
                style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                onClick={() => setInstruction(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {(!activeConversation || activeConversation.messages.length === 0) ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--obs-muted)', maxWidth: '420px', padding: '2rem 1rem' }}>
                <Bot size={28} color="var(--obs-cobalt)" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--obs-text)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  Observatory AI Terminal Ready
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  This session is connected to PostgreSQL durable memory. Ask to explore your repositories, check tech stacks, verify dependencies, or change project statuses.
                </div>
              </div>
            ) : (
              activeConversation.messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '80%' : '98%',
                      width: isUser ? 'auto' : '100%',
                    }}
                  >
                    {/* Header Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.68rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
                      {isUser ? (
                        <>
                          <User size={11} />
                          <span>[HUMAN-OP]</span>
                        </>
                      ) : (
                        <>
                          <Bot size={11} color="var(--obs-cobalt)" />
                          <span>[OBS-AGENT // LANGGRAPH]</span>
                          {m.metadata_json?.intent && (
                            <span className="obs-tag" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                              node:{m.metadata_json.intent}
                            </span>
                          )}
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Content Box */}
                    {isUser ? (
                      <div
                        style={{
                          background: 'var(--obs-graphite)',
                          color: '#F5F5EE',
                          border: '1px solid var(--obs-border)',
                          padding: '0.65rem 0.95rem',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: 'var(--obs-chartreuse)', marginRight: '6px' }}>❯</span>
                        {m.content}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'var(--obs-surface)',
                          border: '1px solid var(--obs-border)',
                          padding: '0.9rem 1.15rem',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--obs-text)', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </div>

                        {/* Safety Gate Explicit Confirmation Banner */}
                        {m.metadata_json?.requires_approval && m.metadata_json?.proposed_changes && (
                          <div
                            style={{
                              marginTop: '0.85rem',
                              padding: '0.75rem 1rem',
                              background: 'rgba(169, 106, 34, 0.08)',
                              border: '1px solid var(--obs-warning)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--obs-warning)', fontWeight: 600, marginBottom: '0.35rem' }}>
                              <AlertTriangle size={14} /> SAFETY GATE: DATABASE MUTATION REQUIRES CONFIRMATION
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--obs-muted)', marginBottom: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                              Proposed state change: <code>{JSON.stringify(m.metadata_json.proposed_changes)}</code>
                            </div>
                            <button
                              className="obs-btn obs-btn-primary"
                              onClick={() => handleSend(true, `Apply changes: ${JSON.stringify(m.metadata_json?.proposed_changes)}`)}
                              disabled={sending}
                              style={{ background: 'var(--obs-warning)', color: '#111412', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            >
                              <Check size={13} /> Confirm & Apply to PostgreSQL
                            </button>
                          </div>
                        )}

                        {/* Action Result / Artifact Payload */}
                        {m.metadata_json?.action_result && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              background: 'var(--obs-canvas)',
                              border: '1px solid var(--obs-border)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              color: 'var(--obs-text)',
                              overflowX: 'auto',
                            }}
                          >
                            <div style={{ color: 'var(--obs-cobalt)', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.68rem' }}>
                              STATE RETRIEVAL PAYLOAD:
                            </div>
                            <pre style={{ margin: 0 }}>
                              {typeof m.metadata_json.action_result === 'string'
                                ? m.metadata_json.action_result
                                : JSON.stringify(m.metadata_json.action_result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Active Loading Animation */}
            {sending && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.95rem',
                  background: 'var(--obs-surface)',
                  border: '1px solid var(--obs-border)',
                  width: 'fit-content',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--obs-cobalt)',
                }}
              >
                <Loader2 size={14} className="spin" />
                <span>Executing LangGraph node ({activeWorkflowNode || 'processing'})...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Command Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--obs-border)',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="obs-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  paddingRight: '2.5rem',
                  height: '42px',
                }}
                placeholder="Send instruction (e.g. 'Summarize In-out-Project-', 'Find all FastAPI apps')..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={sending}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--obs-muted)',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  pointerEvents: 'none',
                }}
              >
                ↵ Enter
              </div>
            </div>

            <button
              type="submit"
              className="obs-btn obs-btn-primary"
              disabled={sending || !instruction.trim()}
              style={{ padding: '0 1.25rem', height: '42px', fontSize: '0.82rem' }}
            >
              <CornerDownLeft size={14} /> Execute
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Execution Audit & Deterministic Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Audit Log Card */}
          <div className="obs-card" style={{ height: '450px', overflowY: 'auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                <Clock size={13} color="var(--obs-cobalt)" />
                <span>TASK AUDIT LOG</span>
              </div>
              <span className="obs-tag" style={{ fontSize: '0.68rem' }}>
                {tasks.length} runs
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskDetail(t)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    background: 'var(--obs-canvas)',
                    border: '1px solid var(--obs-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--obs-cobalt)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--obs-border)')}
                >
                  <div style={{ fontWeight: 600, color: 'var(--obs-text)', fontSize: '0.75rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.instruction}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--obs-muted)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                    <span>{t.task_type}</span>
                    <span
                      style={{
                        color: t.status === 'completed' ? 'var(--obs-success)' : t.status === 'needs_approval' ? 'var(--obs-warning)' : 'var(--obs-error)',
                        fontWeight: 600,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div style={{ color: 'var(--obs-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
                  No execution tasks logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Selected Task Details Inspector */}
          {selectedTaskDetail && (
            <div className="obs-card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--obs-cobalt)', fontFamily: 'var(--font-mono)' }}>
                  RUN #{selectedTaskDetail.id.slice(0, 8)}
                </span>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  style={{ fontSize: '0.7rem', color: 'var(--obs-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  <X size={12} />
                </button>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--obs-text)', marginBottom: '0.4rem', fontWeight: 500 }}>
                {selectedTaskDetail.instruction}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--obs-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                <div><strong>TYPE:</strong> {selectedTaskDetail.task_type}</div>
                <div><strong>STATUS:</strong> <span style={{ color: selectedTaskDetail.status === 'completed' ? 'var(--obs-success)' : 'var(--obs-error)' }}>{selectedTaskDetail.status}</span></div>
                {selectedTaskDetail.error_details && (
                  <div style={{ color: 'var(--obs-error)' }}><strong>ERROR:</strong> {selectedTaskDetail.error_details}</div>
                )}
                <div><strong>TIME:</strong> {new Date(selectedTaskDetail.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {/* Engine Capability Matrix */}
          <div className="obs-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-mono)' }}>
              <Code2 size={13} color="var(--obs-cobalt)" />
              <span>DETERMINISTIC CAPABILITIES</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--obs-muted)', fontFamily: 'var(--font-mono)' }}>
              <div>• Keyword & semantic project filtering</div>
              <div>• AST manifest parsing (package.json, pyproject)</div>
              <div>• Safe project status transitions</div>
              <div>• Localhost subprocess management</div>
              <div>• PostgreSQL durable conversation state</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <ConfirmModal
        isOpen={renameModalOpen}
        title="Rename Session"
        message="Enter a new title for this conversation session:"
        confirmText="Save Title"
        cancelText="Cancel"
        onConfirm={handleRename}
        onCancel={() => {
          setRenameModalOpen(false);
          setConversationToRename(null);
        }}
      >
        <div style={{ marginTop: '0.75rem' }}>
          <input
            type="text"
            className="obs-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Conversation title..."
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Session"
        message={`Are you sure you want to permanently delete "${conversationToDelete?.title}"? All messages in this thread will be permanently deleted from PostgreSQL.`}
        confirmText="Delete Session"
        cancelText="Keep"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setConversationToDelete(null);
        }}
      />
    </div>
  );
};
