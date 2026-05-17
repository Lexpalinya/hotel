'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

// In production this is staff-initiated (they scan the QR with their device
// → server-side mutation). For MVP demo, the guest taps to simulate.
export default function CheckinSimulate({ bookingId, roomId }: { bookingId: string; roomId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const simulate = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from('bookings')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (roomId) await supabase.from('rooms').update({ status: 'occupied' }).eq('id', roomId);
      router.push('/app/stay');
      router.refresh();
    });
  };

  return (
    <button
      onClick={simulate}
      disabled={pending}
      style={{
        marginTop: 20, height: 38, padding: '0 18px', borderRadius: 999,
        background: 'var(--accent)', color: 'white', border: 'none',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      }}>
      {pending ? '...' : '(ຈຳລອງ) ພະນັກງານສະແກນ'}
    </button>
  );
}
