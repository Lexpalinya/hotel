'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { TaskStatus } from '@/lib/types';

type Task = {
  id: string;
  status: TaskStatus;
  kind: string;
  priority: string;
  note: string | null;
  rooms?: { number: string; type: string } | { number: string; type: string }[] | null;
  assignee?: { full_name: string } | { full_name: string }[] | null;
};

const COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'open',        label: 'ຍັງບໍ່ເລີ່ມ', color: 'oklch(0.55 0.10 75)' },
  { id: 'in_progress', label: 'ກຳລັງເຮັດ',   color: 'var(--accent)' },
  { id: 'done',        label: 'ສຳເລັດແລ້ວ', color: 'var(--ok)' },
];

const PRIO: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: 'var(--danger)', bg: 'var(--danger-soft)', label: 'ສູງ' },
  normal: { color: 'var(--ink-2)',  bg: 'var(--paper-2)',     label: 'ປົກກະຕິ' },
  low:    { color: 'var(--ink-3)',  bg: 'var(--paper-2)',     label: 'ຕ່ຳ' },
};

export default function Kanban({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const advance = (t: Task) => {
    const next: TaskStatus = t.status === 'open' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'open';
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('tasks').update({ status: next }).eq('id', t.id);
      // If marking done + cleaning task → room becomes available
      if (next === 'done' && t.kind === 'cleaning') {
        const room = Array.isArray(t.rooms) ? t.rooms[0] : t.rooms;
        if (room) {
          await supabase.from('rooms').update({ status: 'available' }).eq('number', room.number);
        }
      }
      router.refresh();
    });
  };

  const remove = (t: Task) => {
    if (!confirm('ລົບງານນີ້?')) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('tasks').delete().eq('id', t.id);
      router.refresh();
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {COLS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className="h-card" style={{ padding: 14, background: 'var(--paper-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
              </div>
              <span className="h-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{colTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--ink-4)' }}>ບໍ່ມີງານ</div>
              )}
              {colTasks.map((t) => {
                const pm = PRIO[t.priority] || PRIO.normal;
                const room = Array.isArray(t.rooms) ? t.rooms[0] : t.rooms;
                const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
                return (
                  <div key={t.id} style={{
                    background: 'var(--paper)', borderRadius: 10, border: '1px solid var(--line)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div className="h-mono" style={{ fontSize: 18, fontWeight: 600 }}>{room?.number ?? '—'}</div>
                      <div className="h-pill" style={{ background: pm.bg, color: pm.color, height: 18, fontSize: 9.5, padding: '0 7px' }}>
                        {pm.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-2)', textTransform: 'capitalize' }}>
                      {t.kind}{assignee ? ` · ${assignee.full_name}` : ' · ບໍ່ມີຄົນຮັບ'}
                    </div>
                    {t.note && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.4 }}>{t.note}</div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button onClick={() => advance(t)} disabled={pending} className="h-btn h-btn--accent" style={{ flex: 1, height: 26, fontSize: 11 }}>
                        {t.status === 'open' ? 'ເລີ່ມ →' : t.status === 'in_progress' ? 'ສຳເລັດ ✓' : 'ເປີດໃໝ່'}
                      </button>
                      <button onClick={() => remove(t)} disabled={pending} title="ລົບ" style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)',
                        background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer',
                      }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
