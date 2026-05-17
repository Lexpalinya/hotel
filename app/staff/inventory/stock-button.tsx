'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';

type Item = { id: string; name: string; stock: number; unit: string };

export default function StockButton({ item }: { item: Item }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('restock');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (delta === 0) { setErr('ໃສ່ຈຳນວນ (+ ຫຼື -)'); return; }
    if (item.stock + delta < 0) { setErr(`ສະຕັອກຈະຕິດລົບ (${item.stock} + ${delta} = ${item.stock + delta})`); return; }

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      // 1. insert movement
      await supabase.from('stock_movements').insert({
        item_id: item.id, delta, reason, by_user: user?.id,
      });
      // 2. update stock atomically (read latest then write)
      const { data: latest } = await supabase.from('items').select('stock').eq('id', item.id).single();
      await supabase.from('items').update({ stock: (latest?.stock ?? item.stock) + delta }).eq('id', item.id);

      setOpen(false);
      setDelta(0); setReason('restock');
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => { setOpen(true); setDelta(5); setReason('restock'); }} className="h-btn" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>
          + เติม
        </button>
        <button onClick={() => { setOpen(true); setDelta(-1); setReason('used'); }} className="h-btn" style={{ height: 26, padding: '0 8px', fontSize: 11 }}>
          − ใช้
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`ປັບສະຕັອກ — ${item.name}`}
        sub={`ປະຈຸບັນ ${item.stock} ${item.unit}`}
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="stock-form" className="h-btn h-btn--accent" disabled={pending}>
              {pending ? '...' : 'ບັນທຶກ'}
            </button>
          </>
        }>
        <form id="stock-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <Field label="ການປ່ຽນແປງ" hint="ໃສ່ + ສຳລັບເຕີມ, − ສຳລັບໃຊ້">
            <input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} required />
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
              {item.stock} → <strong>{item.stock + delta}</strong> {item.unit}
            </div>
          </Field>
          <Field label="ເຫດຜົນ">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="restock">restock — ເຕີມ</option>
              <option value="used">used — ໃຊ້</option>
              <option value="damaged">damaged — ເສຍ</option>
              <option value="adjustment">adjustment — ນັບໃໝ່</option>
            </select>
          </Field>
          {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        </form>
      </Modal>
    </>
  );
}
