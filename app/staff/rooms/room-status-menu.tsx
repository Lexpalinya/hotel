'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal } from '@/components/modal';
import ImageUpload from '@/components/image-upload';
import { RoomStatusPill } from '@/components/staff-bits';
import type { Room, RoomStatus } from '@/lib/types';

const STATUSES: { value: RoomStatus; label: string }[] = [
  { value: 'available',    label: 'ວ່າງ' },
  { value: 'inspection',   label: 'ລໍກວດສອບຫ້ອງ' },
  { value: 'out_of_order', label: 'ປິດສ້ອມ' },
];

export default function RoomStatusMenu({ room, bg }: { room: Room; bg: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [edit,setEdit]=useState({number:room.number,type:room.type,beds:room.beds||'',capacity:room.capacity,pricePerNight:room.price_per_night,description:room.description||'',amenities:(room.amenities||[]).join(', ')});

  const change = (status: RoomStatus) => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('rooms').update({ status }).eq('id', room.id);
      setOpen(false);
      router.refresh();
    });
  };

  const updateImage = (url: string | null) => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('rooms').update({ image_url: url }).eq('id', room.id);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm(`ປິດໃຊ້ງານຫ້ອງ ${room.number}?`)) return;
    startTransition(async () => {
      const response=await fetch(`/api/staff/rooms/${room.id}`,{method:'DELETE'});if(!response.ok){alert((await response.json()).error);return;}
      setOpen(false);
      router.refresh();
    });
  };
  const saveRoom=()=>startTransition(async()=>{const response=await fetch(`/api/staff/rooms/${room.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(edit)});if(!response.ok){alert((await response.json()).error);return;}router.refresh()});

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
        <div style={{ display: 'grid', gap: 16 }}>
          <ImageUpload value={room.image_url} onChange={updateImage} label="ຮູບຫ້ອງ" />
          <div className="h-eyebrow">ຂໍ້ມູນຫ້ອງ</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><input value={edit.number} onChange={e=>setEdit({...edit,number:e.target.value})} placeholder="ເລກຫ້ອງ"/><input value={edit.type} onChange={e=>setEdit({...edit,type:e.target.value})} placeholder="ປະເພດ"/><input value={edit.beds} onChange={e=>setEdit({...edit,beds:e.target.value})} placeholder="ຕຽງ"/><input type="number" min={1} value={edit.capacity} onChange={e=>setEdit({...edit,capacity:Number(e.target.value)})}/><input type="number" min={0} value={edit.pricePerNight} onChange={e=>setEdit({...edit,pricePerNight:Number(e.target.value)})}/><input value={edit.amenities} onChange={e=>setEdit({...edit,amenities:e.target.value})} placeholder="WiFi, AC"/></div>
          <textarea value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})} placeholder="ລາຍລະອຽດ"/>
          <button className="h-btn h-btn--accent" onClick={saveRoom} disabled={pending}>ບັນທຶກຂໍ້ມູນຫ້ອງ</button>
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
            ປິດໃຊ້ງານຫ້ອງ
          </button>
        </div>
      </Modal>
    </>
  );
}
