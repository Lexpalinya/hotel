'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';
import { formatKip } from '@/lib/format';

type RoomType = { id: string; name: string; beds: string | null; capacity: number; base_price: number; description: string | null; active: boolean };

export default function RoomTypeManager({ initial }: { initial: RoomType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: '', beds: 'King', capacity: 2, base_price: 1200, description: '' });
  const show = (item?: RoomType) => { setEditing(item ?? null); setForm(item ? { name: item.name, beds: item.beds ?? '', capacity: item.capacity, base_price: item.base_price, description: item.description ?? '' } : { name: '', beds: 'King', capacity: 2, base_price: 1200, description: '' }); setOpen(true); };
  const save = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const db = createClient(); const payload = { ...form, description: form.description || null }; const q = editing ? db.from('room_types').update(payload).eq('id', editing.id) : db.from('room_types').insert(payload); await q; setOpen(false); router.refresh(); }); };
  const toggle = (item: RoomType) => start(async () => { await createClient().from('room_types').update({ active: !item.active }).eq('id', item.id); router.refresh(); });
  return <div style={{ padding: 'clamp(14px,3vw,28px)', display: 'grid', gap: 14 }}>
    <div><button className="h-btn h-btn--primary" onClick={() => show()}>+ ເພີ່ມປະເພດ</button></div>
    <div className="h-card" style={{ padding: 0, overflow: 'auto' }}><div style={{ minWidth: 700 }}>
      {initial.map(item => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 80px 120px 100px', gap: 12, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
        <div><strong>{item.name}</strong><div style={{ color: 'var(--ink-3)', fontSize: 11 }}>{item.description || '—'}</div></div><span>{item.beds || '—'}</span><span>{item.capacity} ຄົນ</span><span className="h-mono">{formatKip(item.base_price)}</span><span style={{ display: 'flex', gap: 5 }}><button className="h-btn" onClick={() => show(item)}>ແກ້</button><button className="h-btn" onClick={() => toggle(item)} disabled={pending}>{item.active ? 'ປິດ' : 'ເປີດ'}</button></span>
      </div>)}
    </div></div>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'ແກ້ໄຂປະເພດຫ້ອງ' : 'ເພີ່ມປະເພດຫ້ອງ'} footer={<><button className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button><button form="room-type-form" className="h-btn h-btn--accent" disabled={pending}>ບັນທຶກ</button></>}>
      <form id="room-type-form" onSubmit={save} style={{ display: 'grid', gap: 12 }}><Field label="ຊື່ປະເພດ"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field><Field label="ຕຽງ"><input value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} /></Field><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="ຈຳນວນຄົນ"><input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></Field><Field label="ລາຄາພື້ນຖານ"><input type="number" min={0} value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} /></Field></div><Field label="ລາຍລະອຽດ"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></form>
    </Modal>
  </div>;
}
