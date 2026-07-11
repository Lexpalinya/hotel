'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { BookingStatus } from '@/lib/types';

export default function BookingActions({
  id, status, roomId,
}: { id: string; status: BookingStatus; roomId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const checkIn = () => {
    startTransition(async () => {
      const response = await fetch(`/api/staff/bookings/${id}/check-in`, { method: 'POST' });
      if (!response.ok) alert((await response.json()).error || 'Check-in failed');
      router.refresh();
    });
  };

  const checkOut = () => {
    startTransition(async () => {
      const response = await fetch(`/api/staff/bookings/${id}/check-out`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: '{}' });
      if (!response.ok) alert((await response.json()).error || 'Check-out failed');
      router.refresh();
    });
  };

  const cancel = () => {
    if (!confirm('ຍົກເລີກການຈອງນີ້?')) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
      if (roomId) await supabase.from('rooms').update({ status: 'available' }).eq('id', roomId);
      router.refresh();
    });
  };

  if (status === 'confirmed' || status === 'pending') {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={checkIn} disabled={pending} className="h-btn h-btn--accent" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>
          Check in
        </button>
        <button onClick={cancel} disabled={pending} title="ຍົກເລີກ" style={{
          width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)',
          background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12,
        }}>×</button>
      </div>
    );
  }

  if (status === 'checked_in') {
    return (
      <button onClick={checkOut} disabled={pending} className="h-btn h-btn--primary" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>
        Check out
      </button>
    );
  }

  return <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>—</span>;
}
