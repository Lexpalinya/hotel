'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';
import { formatKip, nightsBetween, bookingCode } from '@/lib/format';
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

  const room = rooms.find((r) => r.id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const total = room ? nights * room.price_per_night : 0;
  const maxGuests = room?.capacity ?? 99;

  // เมื่อเปลี่ยนห้อง ถ้า guests เกิน capacity ของห้องใหม่ ให้ clamp ลง
  useEffect(() => {
    if (room && guests > room.capacity) setGuests(room.capacity);
  }, [room, guests]);

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
      const supabase = createClient();

      // 1. Create or find user by email
      let guestId: string | null = null;
      if (email) {
        const { data: existing } = await supabase
          .from('users').select('id').eq('email', email).maybeSingle();
        if (existing) {
          guestId = existing.id;
          await supabase.from('users').update({ full_name: name, phone }).eq('id', existing.id);
        }
        // walk-in without auth: leave guest_id null, store name/contact in notes
      }

      // 2. Create booking
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .insert({
          code: bookingCode(),
          guest_id: guestId,
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          status: paid ? 'confirmed' : 'pending',
          total_amount: total,
          notes: guestId ? null : `Walk-in: ${name}${phone ? ' · ' + phone : ''}${email ? ' · ' + email : ''}`,
        })
        .select('id')
        .single();
      if (bErr || !booking) { setErr(bErr?.message ?? 'Booking failed'); return; }

      // 3. If marked paid, create payment record
      if (paid) {
        await supabase.from('payments').insert({
          booking_id: booking.id,
          amount: total,
          method: 'cash',
          status: 'paid',
          paid_at: new Date().toISOString(),
          ref: 'WALK-IN',
        });
        await supabase.from('rooms').update({ status: 'reserved' }).eq('id', room.id);
      }

      setOpen(false);
      reset();
      router.refresh();
    });
  };

  const availableRooms = rooms.filter((r) => r.status === 'available');

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
              {pending ? '...' : `ສ້າງ + ${paid ? 'ບັນທຶກວ່າຈ່າຍ' : 'ລໍຈ່າຍ'} (${formatKip(total)})`}
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
            <span style={{ fontSize: 13 }}>ຮັບເງິນສົດແລ້ວ (cash · ${formatKip(total).replace('$','')}) — ໝາຍວ່າຈ່າຍແລ້ວທັນທີ</span>
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
