import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  CornerDownLeft,
  Edit2,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { api } from '../api/client';
import {
  ConversationDetail,
  ConversationItem,
  MessageItem,
  Project,
} from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export const AgentChat: React.FC = () => {
  // Persistent Conversations State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationSearch, setConversationSearch] = useState('');

  // Execution & Messaging State
  const [instruction, setInstruction] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sending, setSending] = useState(false);

  // Modals for Rename and Delete
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<ConversationItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load projects for project scope filter
  useEffect(() => {
    api.getProjects({ page_size: 50 }).then((res) => {
      setProjects(res.items);
    }).catch(console.error);
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
        const created = await api.createConversation({ title: 'New Conversation' });
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
  }, [loadConversations]);

  // When activeConversationId changes, load full message history
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

  // Create new conversation
  const handleCreateNewConversation = async () => {
    try {
      const created = await api.createConversation({
        title: `Chat ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
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

  // Send Message
  const handleSend = async (confirmAction: boolean = false, prefillMsg?: string) => {
    const query = prefillMsg || instruction;
    if (!query.trim() && !confirmAction) return;

    if (!activeConversationId) {
      const created = await api.createConversation({ title: query.slice(0, 40) });
      setActiveConversationId(created.id);
      return;
    }

    setSending(true);

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
      setSending(false);
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
          const fresh = await api.createConversation({ title: 'New Conversation' });
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

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Streamlined 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Saved Conversations Sidebar */}
        <div
          className="obs-card"
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            height: '740px',
            background: 'var(--bg-surface)',
          }}
        >
          {/* New Chat Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <MessageSquare size={16} color="var(--accent-primary)" />
              <span>Saved Chats</span>
            </div>
            <button
              onClick={handleCreateNewConversation}
              className="obs-btn obs-btn-primary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
            >
              <Plus size={13} /> New Chat
            </button>
          </div>

          {/* Search Filter */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              className="obs-input"
              style={{ paddingLeft: '2.1rem', fontSize: '0.8rem', height: '34px' }}
            />
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.2rem' }}>
            {loadingConversations ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Loader2 size={16} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No chats found. Click "+ New Chat" to start.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConversationId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '4px',
                      background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                      border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-recessed)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.82rem',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '170px',
                        }}
                      >
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
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                          title="Rename"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(c);
                            setDeleteModalOpen(true);
                          }}
                          style={{ color: 'var(--text-muted)', padding: '2px' }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span>{c.message_count ?? 0} messages</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Streamlined Conversational Console */}
        <div
          className="obs-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '740px',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
          }}
        >
          {/* Header Bar: Project Scope Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-structural)',
              marginBottom: '0.85rem',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-structural)',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  AI Project Assistant
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Persistent PostgreSQL Memory
                </div>
              </div>
            </div>

            {/* Scope Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={14} color="var(--text-muted)" />
              <select
                className="obs-input"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', height: '32px', width: '220px' }}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">Scope: All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Action Suggested Chips */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-structural)' }}>
            {[
              { label: '🔍 Find Computer Vision', query: 'Find all computer vision projects' },
              { label: '📊 Summarize All Projects', query: 'Summarize my active engineering projects' },
              { label: '📦 Inspect Dependencies', query: 'Inspect package.json and requirements manifests' },
              { label: '🚀 Localhost Runner', query: 'Launch project on localhost runner' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="obs-tag"
                style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                onClick={() => setInstruction(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {(!activeConversation || activeConversation.messages.length === 0) ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '420px', padding: '3rem 1rem' }}>
                <Bot size={32} color="var(--accent-primary)" style={{ margin: '0 auto 0.85rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.35rem' }}>
                  How can I help with your projects?
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  Ask to summarize your repositories, inspect manifests, explore dependencies, or verify project statuses. Conversations are saved permanently in PostgreSQL.
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
                      gap: '0.35rem',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '75%' : '92%',
                      width: isUser ? 'auto' : '100%',
                    }}
                  >
                    {/* Role Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {isUser ? (
                        <>
                          <User size={12} />
                          <span>You</span>
                        </>
                      ) : (
                        <>
                          <Bot size={12} color="var(--accent-primary)" />
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>AI Assistant</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Bubble Content */}
                    {isUser ? (
                      <div
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-structural)',
                          padding: '0.75rem 1rem',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {m.content}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-structural)',
                          borderRadius: '6px',
                          padding: '1rem 1.15rem',
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </div>

                        {/* Safety Gate Confirmation Banner */}
                        {m.metadata_json?.requires_approval && m.metadata_json?.proposed_changes && (
                          <div
                            style={{
                              marginTop: '0.85rem',
                              padding: '0.85rem 1rem',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid var(--warning)',
                              borderRadius: '4px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.35rem' }}>
                              <AlertTriangle size={15} /> Database Mutation Confirmation Required
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                              Target state change: <code>{JSON.stringify(m.metadata_json.proposed_changes)}</code>
                            </div>
                            <button
                              className="obs-btn obs-btn-primary"
                              onClick={() => handleSend(true, `Apply changes: ${JSON.stringify(m.metadata_json?.proposed_changes)}`)}
                              disabled={sending}
                              style={{ background: 'var(--warning)', color: '#111412', fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                            >
                              <Check size={13} /> Confirm & Apply to Database
                            </button>
                          </div>
                        )}

                        {/* Structured Output Payload */}
                        {m.metadata_json?.action_result && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              background: 'var(--bg-canvas)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-structural)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.74rem',
                              color: 'var(--text-primary)',
                              overflowX: 'auto',
                            }}
                          >
                            <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.7rem' }}>
                              Result Data:
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

            {/* Active Thinking Animation */}
            {sending && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.65rem 0.95rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-structural)',
                  borderRadius: '6px',
                  width: 'fit-content',
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                }}
              >
                <Loader2 size={14} className="spin" />
                <span>AI Assistant is analyzing...</span>
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
              borderTop: '1px solid var(--border-structural)',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="obs-input"
                style={{
                  fontSize: '0.86rem',
                  paddingRight: '2.5rem',
                  height: '44px',
                }}
                placeholder="Ask or command (e.g. 'Summarize In-out-Project-', 'Find all FastAPI apps')..."
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
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
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
              style={{ padding: '0 1.25rem', height: '44px', fontSize: '0.84rem' }}
            >
              <CornerDownLeft size={14} /> Send
            </button>
          </form>
        </div>
      </div>

      {/* Rename Modal */}
      <ConfirmModal
        isOpen={renameModalOpen}
        title="Rename Chat"
        message="Enter a new title for this conversation:"
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
        title="Delete Chat"
        message={`Are you sure you want to delete "${conversationToDelete?.title}"? All messages in this thread will be permanently deleted.`}
        confirmText="Delete Chat"
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
