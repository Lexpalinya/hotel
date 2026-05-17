'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { QRish } from '@/components/qr';

export default function PayPanel({ bookingId, amount }: { bookingId: string; amount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const markPaid = () => {
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: payErr } = await supabase.from('payments').insert({
        booking_id: bookingId,
        amount,
        method: 'promptpay',
        status: 'paid',
        paid_at: new Date().toISOString(),
        ref: 'MVP-MOCK-' + Date.now(),
      });
      if (payErr) { setErr(payErr.message); return; }
      const { error: bErr } = await supabase
        .from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
      if (bErr) { setErr(bErr.message); return; }
      router.push('/app');
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <QRish seed={bookingId} size={200} />
      </div>
      <div className="h-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 14 }}>
        PromptPay · 099-285-1234
      </div>
      {err && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--danger)' }}>{err}</div>
      )}
      <button onClick={markPaid} disabled={pending} className="h-btn h-btn--primary" style={{ width: '100%', height: 44, marginTop: 18 }}>
        {pending ? '...' : 'ຂ້ອຍຈ່າຍແລ້ວ — ຢືນຢັນ'}
      </button>
    </>
  );
}
