'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal } from '@/components/modal';
import { RoomStatusPill } from '@/components/staff-bits';
import type { Room, RoomStatus } from '@/lib/types';

const STATUSES: { value: RoomStatus; label: string }[] = [
  { value: 'available',    label: 'ວ່າງ' },
  { value: 'reserved',     label: 'ຖືກຈອງ' },
  { value: 'occupied',     label: 'ມີຜູ້ພັກ' },
  { value: 'dirty',        label: 'ລໍຖ້າທຳຄວາມສະອາດ' },
  { value: 'cleaning',     label: 'ກຳລັງເຮັດ' },
  { value: 'out_of_order', label: 'ປິດສ້ອມ' },
];

export default function RoomStatusMenu({ room, bg }: { room: Room; bg: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const change = (status: RoomStatus) => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('rooms').update({ status }).eq('id', room.id);
      setOpen(false);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm(`ລົບຫ້ອງ ${room.number}? (ບໍ່ສາມາດກູ້ຄືນໄດ້)`)) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('rooms').delete().eq('id', room.id);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-2)',
          background: bg, color: room.status === 'occupied' ? 'white' : 'var(--ink)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}>
        <div className="h-mono" style={{ fontSize: 16, fontWeight: 600 }}>{room.number}</div>
        <div style={{ fontSize: 9.5, marginTop: 4, opacity: 0.8 }}>
          <RoomStatusPill status={room.status} />
        </div>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`ຫ້ອງ ${room.number}`}
        sub={`${room.type} · ₭${room.price_per_night.toLocaleString()}/ຄືນ · ${room.capacity} ຄົນ`}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="h-eyebrow" style={{ marginBottom: 4 }}>ປ່ຽນສະຖານະ</div>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => change(s.value)}
              disabled={pending || s.value === room.status}
              style={{
                padding: '10px 14px', textAlign: 'left',
                border: '1px solid var(--line)', borderRadius: 8,
                background: s.value === room.status ? 'var(--paper-2)' : 'var(--paper)',
                fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                opacity: s.value === room.status ? 0.5 : 1,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
              <span><RoomStatusPill status={s.value} /></span>
              {s.value === room.status && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>ປະຈຸບັນ</span>}
            </button>
          ))}
          <button onClick={remove} disabled={pending}
            style={{
              marginTop: 8, padding: '10px 14px',
              border: '1px solid var(--danger)', borderRadius: 8,
              background: 'var(--paper)', color: 'var(--danger)',
              fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
            }}>
            ລົບຫ້ອງ
          </button>
        </div>
      </Modal>
    </>
  );
}
