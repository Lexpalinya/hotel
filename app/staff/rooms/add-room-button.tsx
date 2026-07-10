'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';
import ImageUpload from '@/components/image-upload';
import type { Floor } from '@/lib/types';

type RoomTypeOption = { name: string; beds: string | null; capacity: number; base_price: number };
export default function AddRoomButton({ floors, roomTypes }: { floors: Floor[]; roomTypes: RoomTypeOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [number, setNumber] = useState('');
  const [type, setType] = useState(roomTypes[0]?.name ?? 'Standard');
  const [beds, setBeds] = useState('King');
  const [capacity, setCapacity] = useState(2);
  const [price, setPrice] = useState(1200);
  const [floorId, setFloorId] = useState(floors[0]?.id ?? '');
  const [amenities, setAmenities] = useState('WiFi, AC');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const reset = () => {
    setNumber(''); setType(roomTypes[0]?.name ?? 'Standard'); setBeds('King'); setCapacity(2);
    setPrice(1200); setFloorId(floors[0]?.id ?? ''); setAmenities('WiFi, AC');
    setDescription(''); setImageUrl(null);
    setErr(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('rooms').insert({
        number, type, beds, capacity, price_per_night: price,
        floor_id: floorId || null,
        amenities: amenities.split(',').map(s => s.trim()).filter(Boolean),
        description: description || null,
        image_url: imageUrl,
        status: 'available',
      });
      if (error) { setErr(error.message); return; }
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <button className="h-btn h-btn--primary" onClick={() => setOpen(true)}>+ ເພີ່ມຫ້ອງ</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ເພີ່ມຫ້ອງໃໝ່"
        sub="ສ້າງຫ້ອງໃໝ່ໃນລະບົບ"
        width={520}
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="add-room-form" className="h-btn h-btn--accent" disabled={pending}>
              {pending ? '...' : 'ສ້າງຫ້ອງ'}
            </button>
          </>
        }>
        <form id="add-room-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ເລກຫ້ອງ">
              <input value={number} onChange={(e) => setNumber(e.target.value)} required placeholder="412" />
            </Field>
            <Field label="ຊັ້ນ">
              <select value={floorId} onChange={(e) => setFloorId(e.target.value)}>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>F{f.number} — {f.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ປະເພດ">
              <select value={type} onChange={(e) => { const value=e.target.value; setType(value); const selected=roomTypes.find(t=>t.name===value); if(selected){setBeds(selected.beds??'');setCapacity(selected.capacity);setPrice(selected.base_price);} }}>
                {roomTypes.map(t => <option key={t.name}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="ຕຽງ">
              <select value={beds} onChange={(e) => setBeds(e.target.value)}>
                <option>Single</option>
                <option>Twin</option>
                <option>King</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ຄວາມຈຸ (ຄົນ)">
              <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} min={1} max={6} />
            </Field>
            <Field label="ລາຄາ / ຄືນ (₭)">
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step={100} />
            </Field>
          </div>
          <Field label="ສິ່ງອຳນວຍ" hint="ຄັ່ນດ້ວຍ ,">
            <input value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="WiFi, AC, Desk" />
          </Field>
          <Field label="ລາຍລະອຽດ">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="(optional)" />
          </Field>
          <ImageUpload value={imageUrl} onChange={setImageUrl} label="ຮູບຫ້ອງ" />
          {err && (
            <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-soft)', padding: '8px 10px', borderRadius: 6 }}>
              {err}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
