'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';

const PRESETS: { label: string; amount: number }[] = [
  { label: 'Mini-bar — ນ້ຳ',          amount: 30 },
  { label: 'Mini-bar — ເບຍ',          amount: 80 },
  { label: 'ຊັກລີດ',                   amount: 120 },
  { label: 'Late check-out',          amount: 200 },
  { label: 'Damage / Lost key',       amount: 500 },
];

export default function AddChargeButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('booking_charges')
        .insert({ booking_id: bookingId, label, amount });
      if (error) { setErr(error.message); return; }
      setOpen(false);
      setLabel(''); setAmount(0);
      router.refresh();
    });
  };

  const usePreset = (p: { label: string; amount: number }) => {
    setLabel(p.label); setAmount(p.amount);
  };

  return (
    <>
      <button className="h-btn h-btn--primary" onClick={() => setOpen(true)}>+ ເພີ່ມຄ່າ</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ເພີ່ມຄ່າເພີ່ມ"
        sub="Mini-bar, ຊັກລີດ, ຄ່າອື່ນໆ"
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="charge-form" className="h-btn h-btn--accent" disabled={pending || !label || !amount}>
              {pending ? '...' : 'ເພີ່ມ'}
            </button>
          </>
        }>
        <form id="charge-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <div className="h-eyebrow" style={{ marginBottom: 8 }}>ໃຊ້ preset</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => usePreset(p)} className="h-pill" style={{ cursor: 'pointer', height: 26 }}>
                  {p.label} ₭{p.amount}
                </button>
              ))}
            </div>
          </div>
          <Field label="ລາຍລະອຽດ">
            <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Mini-bar - Coke" />
          </Field>
          <Field label="ຈຳນວນ (₭)">
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required min={1} step={10} />
          </Field>
          {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        </form>
      </Modal>
    </>
  );
}
