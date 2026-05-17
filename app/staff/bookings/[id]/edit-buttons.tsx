'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';
import type { Booking } from '@/lib/types';
import { nightsBetween } from '@/lib/format';

export default function BookingEditButtons({ booking }: { booking: Booking & { rooms?: { price_per_night: number } } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState(booking.check_in);
  const [checkOut, setCheckOut] = useState(booking.check_out);
  const [guests, setGuests] = useState(booking.guests);
  const [notes, setNotes] = useState(booking.notes ?? '');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const newNights = nightsBetween(checkIn, checkOut);
      const newTotal = booking.rooms?.price_per_night ? newNights * booking.rooms.price_per_night : booking.total_amount;
      const { error } = await supabase
        .from('bookings')
        .update({
          check_in: checkIn,
          check_out: checkOut,
          guests,
          notes: notes || null,
          total_amount: newTotal,
        })
        .eq('id', booking.id);
      if (error) { setErr(error.message); return; }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="h-btn" onClick={() => setOpen(true)}>ແກ້ໄຂ</button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ແກ້ໄຂການຈອງ"
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="edit-booking-form" className="h-btn h-btn--accent" disabled={pending}>
              {pending ? '...' : 'ບັນທຶກ'}
            </button>
          </>
        }>
        <form id="edit-booking-form" onSubmit={save} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="CHECK-IN">
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </Field>
            <Field label="CHECK-OUT">
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required min={checkIn} />
            </Field>
          </div>
          <Field label="ຜູ້ເຂົ້າພັກ">
            <input type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value))} min={1} max={6} />
          </Field>
          <Field label="ໝາຍເຫດ">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>
          {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        </form>
      </Modal>
    </>
  );
}
