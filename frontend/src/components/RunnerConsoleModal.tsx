import React, { useEffect, useState } from 'react';
import { ExternalLink, Play, Square, Terminal, X, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { RunStatusResponse } from '../types';

interface RunnerConsoleModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
}

export const RunnerConsoleModal: React.FC<RunnerConsoleModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [statusInfo, setStatusInfo] = useState<RunStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getRunStatus(projectId);
      setStatusInfo(data);
      if (onStatusChange && data.status) {
        onStatusChange(data.status);
      }
    } catch (err) {
      console.error('Failed to get run status:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchStatus();
    // Poll every 2 seconds while starting, cloning, or installing
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, projectId]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.stopProjectLocally(projectId);
      await fetchStatus();
    } catch (err) {
      console.error('Error stopping project:', err);
    } finally {
      setStopping(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      await api.runProjectLocally(projectId);
      await fetchStatus();
    } catch (err) {
      console.error('Error launching project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isRunning = statusInfo?.status === 'running';
  const isBusy = ['starting', 'cloning', 'installing_backend', 'installing_frontend'].includes(
    statusInfo?.status || ''
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Terminal size={22} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Local Execution: {projectName}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Target Directory: {statusInfo?.target_dir || 'Documents/projects_local'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Status & Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
            <span
              className={`badge ${
                isRunning
                  ? 'badge-status-completed'
                  : isBusy
                  ? 'badge-status-in-development'
                  : 'badge-status-archived'
              }`}
            >
              {isBusy && <RefreshCw size={12} className="spin" style={{ marginRight: '4px' }} />}
              {statusInfo?.status || 'idle'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isRunning ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleStop}
                disabled={stopping}
              >
                <Square size={14} /> Stop Execution
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRestart}
                disabled={loading || isBusy}
              >
                <Play size={14} /> {isBusy ? 'Processing...' : 'Run Again'}
              </button>
            )}
          </div>
        </div>

        {/* Localhost Links if running */}
        {isRunning && (statusInfo?.frontend_url || statusInfo?.backend_url) && (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {statusInfo.frontend_url && (
              <a
                href={statusInfo.frontend_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                Open Frontend ({statusInfo.frontend_url}) <ExternalLink size={14} />
              </a>
            )}
            {statusInfo.backend_url && (
              <a
                href={statusInfo.backend_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Open Backend API ({statusInfo.backend_url}) <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* Live Terminal Log Viewer */}
        <div className="obs-terminal">
          <div className="obs-terminal-header">
            <span>[RUNNER_LOG_STREAM // MACOS_SUBPROCESS]</span>
            <button onClick={fetchStatus} style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <div className="obs-terminal-body">
            {statusInfo?.logs || 'Waiting for log stream...'}
          </div>
        </div>
      </div>
    </div>
  );
};
