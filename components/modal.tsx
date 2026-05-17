'use client';

import { useEffect } from 'react';

export function Modal({
  open, onClose, title, sub, children, footer, width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(30,22,16,0.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="h-card" style={{
        width, maxWidth: '92%', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px -20px rgba(20,15,10,0.35)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div className="h-serif" style={{ fontSize: 18 }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
          </div>
          <div onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, color: 'var(--ink-3)', background: 'var(--paper-2)',
          }}>×</div>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--line)',
            display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--paper-2)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
  );
}
