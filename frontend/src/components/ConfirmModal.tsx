import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'primary' | 'default';
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive = false,
  variant,
  children,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = isDestructive || variant === 'danger';
  const finalConfirmLabel = confirmText || confirmLabel || 'Confirm';
  const finalCancelLabel = cancelText || cancelLabel || 'Cancel';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 20, 18, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        className="obs-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '1.5rem',
          background: 'var(--obs-surface)',
          border: isDanger ? '1px solid var(--obs-error)' : '1px solid var(--obs-border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isDanger && <AlertTriangle size={18} color="var(--obs-error)" />}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0, color: 'var(--obs-text)' }}>
              {title}
            </h3>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--obs-muted)', cursor: 'pointer', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--obs-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
          {message}
        </p>

        {children && <div style={{ marginBottom: '1.25rem' }}>{children}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button className="obs-btn obs-btn-secondary" onClick={onCancel}>
            {finalCancelLabel}
          </button>
          <button
            className={`obs-btn ${isDanger ? 'obs-btn-primary' : 'obs-btn-primary'}`}
            style={{
              background: isDanger ? 'var(--obs-error)' : undefined,
              color: isDanger ? '#FFFFFF' : undefined,
            }}
            onClick={onConfirm}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
