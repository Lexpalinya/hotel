'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';

export default function NewTaskButton({
  rooms, staff,
}: {
  rooms: { id: string; number: string; type: string }[];
  staff: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [roomId, setRoomId] = useState('');
  const [kind, setKind] = useState<'cleaning' | 'maintenance' | 'inspection'>('cleaning');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').insert({
        room_id: roomId || null,
        kind, priority,
        assigned_to: assignedTo || null,
        note: note || null,
        status: 'open',
      });
      if (error) { setErr(error.message); return; }
      setOpen(false);
      setRoomId(''); setKind('cleaning'); setPriority('normal'); setAssignedTo(''); setNote('');
      router.refresh();
    });
  };

  return (
    <>
      <button className="h-btn h-btn--primary" onClick={() => setOpen(true)}>+ ມອບງານ</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ມອບງານໃໝ່"
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="new-task-form" className="h-btn h-btn--accent" disabled={pending}>
              {pending ? '...' : 'ສ້າງງານ'}
            </button>
          </>
        }>
        <form id="new-task-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <Field label="ຫ້ອງ">
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
              <option value="">— ເລືອກ —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>ຫ້ອງ {r.number} · {r.type}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ປະເພດງານ">
              <select value={kind} onChange={(e) => setKind(e.target.value as 'cleaning' | 'maintenance' | 'inspection')}>
                <option value="cleaning">ທຳຄວາມສະອາດ</option>
                <option value="maintenance">ສ້ອມແປງ</option>
                <option value="inspection">ກວດກາ</option>
              </select>
            </Field>
            <Field label="ຄວາມສຳຄັນ">
              <select value={priority} onChange={(e) => setPriority(e.target.value as 'high' | 'normal' | 'low')}>
                <option value="high">ສູງ</option>
                <option value="normal">ປົກກະຕິ</option>
                <option value="low">ຕ່ຳ</option>
              </select>
            </Field>
          </div>
          <Field label="ມອບໝາຍໃຫ້">
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">(ບໍ່ມອບໝາຍ — ໃຫ້ໃຜຮັບກໍ່ໄດ້)</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="ໝາຍເຫດ">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="..." />
          </Field>
          {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        </form>
      </Modal>
    </>
  );
}
