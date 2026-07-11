'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatKip, nightsBetween } from '@/lib/format';
import type { Room } from '@/lib/types';

export default function BookForm({ room, initial }: { room: Room; initial?: { checkIn?: string; checkOut?: string; guests?: number } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const tmrw = new Date(today.getTime() + 86400000);
  const [checkIn, setCheckIn] = useState(initial?.checkIn || today.toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(initial?.checkOut || tmrw.toISOString().slice(0, 10));
  const [guests, setGuests] = useState(Math.min(room.capacity, Math.max(1, initial?.guests || 1)));

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * room.price_per_night;

  const setGuestsClamped = (raw: number) => {
    if (!Number.isFinite(raw)) { setGuests(1); return; }
    const n = Math.max(1, Math.min(room.capacity, Math.floor(raw)));
    setGuests(n);
  };

  const book = () => {
    setError(null);
    if (guests > room.capacity) {
      setError(`ຫ້ອງນີ້ຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ`);
      return;
    }
    if (guests < 1) {
      setError('ກະລຸນາໃສ່ຈຳນວນຜູ້ເຂົ້າພັກ');
      return;
    }
    startTransition(async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, checkIn, checkOut, guests }),
      });
      const result = await response.json() as { data?: { id: string }; error?: string };
      if (!response.ok || !result.data) { setError(result.error ?? 'Booking failed'); return; }
      router.push(`/app/pay/${result.data.id}`);
    });
  };

  return (
    <>
      <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>ເຂົ້າພັກ</span>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>ອອກ</span>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn} />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between' }}>
            <span>ຜູ້ເຂົ້າພັກ</span>
            <span style={{ color: 'var(--ink-3)' }}>ສູງສຸດ {room.capacity} ຄົນ</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={guests}
            onChange={(e) => setGuestsClamped(Number(e.target.value))}
            onBlur={() => setGuestsClamped(guests)}
            min={1}
            max={room.capacity}
          />
          {guests >= room.capacity && (
            <span style={{ fontSize: 10, color: 'var(--warn)' }}>
              ເຖິງຈຳນວນສູງສຸດແລ້ວ
            </span>
          )}
        </label>
        <div style={{ borderTop: '1px solid var(--line-2)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{nights} ຄືນ × {formatKip(room.price_per_night)}</span>
          <span className="h-mono" style={{ fontSize: 20, fontWeight: 600 }}>{formatKip(total)}</span>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--danger)', background: 'var(--danger-soft)', padding: '8px 10px', borderRadius: 6 }}>
          {error}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto', padding: '12px 18px 14px',
        background: 'var(--paper)', borderTop: '1px solid var(--line)',
      }}>
        <button onClick={book} disabled={pending} className="h-btn h-btn--accent" style={{ width: '100%', height: 46 }}>
          {pending ? 'ກຳລັງຈອງ...' : 'ຈອງ ແລະ ໄປຈ່າຍເງິນ →'}
        </button>
      </div>
    </>
  );
}
