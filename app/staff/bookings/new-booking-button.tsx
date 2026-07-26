'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Field } from '@/components/modal';
import { formatKip, nightsBetween } from '@/lib/format';
import type { Room } from '@/lib/types';

export default function NewBookingButton({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const today = new Date();
  const tmrw = new Date(today.getTime() + 86400000);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState(today.toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(tmrw.toISOString().slice(0, 10));
  const [guests, setGuests] = useState(1);
  const [paid, setPaid] = useState(true);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(rooms.filter(r => r.status === 'available'));

  const room = rooms.find((r) => r.id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const total = room ? nights * room.price_per_night : 0;
  const deposit = Math.ceil(total * .7);
  const maxGuests = room?.capacity ?? 99;

  // เมื่อเปลี่ยนห้อง ถ้า guests เกิน capacity ของห้องใหม่ ให้ clamp ลง
  useEffect(() => {
    if (room && guests > room.capacity) setGuests(room.capacity);
  }, [room, guests]);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const q = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
      const response = await fetch(`/api/availability?${q}`, { signal: controller.signal });
      if (!response.ok) return;
      const result = await response.json() as { data?: Room[] };
      setAvailableRooms(result.data ?? []);
      if (roomId && !(result.data ?? []).some(r => r.id === roomId)) setRoomId('');
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [checkIn, checkOut, guests, roomId]);

  const setGuestsClamped = (raw: number) => {
    if (!Number.isFinite(raw)) { setGuests(1); return; }
    const cap = room?.capacity ?? 99;
    setGuests(Math.max(1, Math.min(cap, Math.floor(raw))));
  };

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setRoomId('');
    setCheckIn(today.toISOString().slice(0, 10));
    setCheckOut(tmrw.toISOString().slice(0, 10));
    setGuests(1); setPaid(true); setErr(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!room) { setErr('ເລືອກຫ້ອງ'); return; }
    if (guests > room.capacity) { setErr(`ຫ້ອງນີ້ຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ`); return; }
    if (guests < 1) { setErr('ກະລຸນາໃສ່ຈຳນວນຜູ້ເຂົ້າພັກ'); return; }

    startTransition(async () => {
      const response = await fetch('/api/staff/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name,email,phone,roomId:room.id,checkIn,checkOut,guests,paid,method:'cash' }) });
      const result = await response.json() as { error?:string };
      if(!response.ok){setErr(result.error||'Booking failed');return;}

      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <>
      <button className="h-btn h-btn--primary" onClick={() => setOpen(true)}>+ ຈອງໃໝ່ (Walk-in)</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ການຈອງໃໝ່ — Walk-in"
        sub="ສ້າງການຈອງໃຫ້ລູກຄ້າທີ່ມາໜ້າເຄົາເຕີ"
        width={560}
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="new-booking-form" className="h-btn h-btn--accent" disabled={pending || !room}>
              {pending ? '...' : `ສ້າງ + ${paid ? 'ມັດຈຳ 70%' : 'ລໍຈ່າຍ'} (${formatKip(paid?deposit:total)})`}
            </button>
          </>
        }>
        <form id="new-booking-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div className="h-eyebrow">ຂໍ້ມູນແຂກ</div>
          <Field label="ຊື່">
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="ນາງ ສຸພາ ແກ້ວ" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ເບີໂທ">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020-..." />
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="..." />
            </Field>
          </div>

          <div className="h-eyebrow" style={{ marginTop: 8 }}>ການຈອງ</div>
          <Field label="ຫ້ອງ" hint={`${availableRooms.length} ຫ້ອງວ່າງ`}>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
              <option value="">— ເລືອກ —</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  ຫ້ອງ {r.number} · {r.type} · ₭{r.price_per_night.toLocaleString()}/ຄືນ · {r.capacity} ຄົນ
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="ເຂົ້າພັກ">
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </Field>
            <Field label="ອອກ">
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required min={checkIn} />
            </Field>
            <Field label="ຜູ້ເຂົ້າພັກ" hint={room ? `ສູງສຸດ ${room.capacity} ຄົນ` : 'ເລືອກຫ້ອງກ່ອນ'}>
              <input
                type="number"
                inputMode="numeric"
                value={guests}
                onChange={(e) => setGuestsClamped(Number(e.target.value))}
                onBlur={() => setGuestsClamped(guests)}
                min={1}
                max={maxGuests}
                disabled={!room}
              />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--paper-2)', borderRadius: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} style={{ width: 'auto' }} />
            <span style={{ fontSize: 13 }}>ຮັບເງິນມັດຈຳ 70% ແລ້ວ (cash · {formatKip(deposit)})</span>
          </label>

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
