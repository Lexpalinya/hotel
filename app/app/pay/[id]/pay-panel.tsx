'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { QRish } from '@/components/qr';

export default function PayPanel({ bookingId, amount }: { bookingId: string; amount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const markPaid = () => {
    setErr(null);
    startTransition(async () => {
      const response=await fetch('/api/customer/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookingId})});
      const result=await response.json() as {error?:string}; if(!response.ok){setErr(result.error||'Payment submission failed');return;}
      router.push('/app/history');
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
        {pending ? '...' : 'ແຈ້ງຊຳລະ — ສົ່ງໃຫ້ Staff ກວດສອບ'}
      </button>
    </>
  );
}
