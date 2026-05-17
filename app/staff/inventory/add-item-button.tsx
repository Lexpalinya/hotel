'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Modal, Field } from '@/components/modal';

export default function AddItemButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('minibar');
  const [stock, setStock] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState<number | ''>('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('items').insert({
        sku, name, category, stock, threshold, unit,
        price: price === '' ? null : price,
      });
      if (error) { setErr(error.message); return; }
      setOpen(false);
      setSku(''); setName(''); setStock(0); setThreshold(5); setPrice('');
      router.refresh();
    });
  };

  return (
    <>
      <button className="h-btn h-btn--primary" onClick={() => setOpen(true)}>+ ເພີ່ມສິນຄ້າ</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ເພີ່ມສິນຄ້າໃໝ່"
        footer={
          <>
            <button type="button" className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="add-item-form" className="h-btn h-btn--accent" disabled={pending}>
              {pending ? '...' : 'ສ້າງ'}
            </button>
          </>
        }>
        <form id="add-item-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <Field label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="MB-001" />
            </Field>
            <Field label="ຊື່">
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Coke 330ml" />
            </Field>
          </div>
          <Field label="ໝວດໝູ່">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="minibar">Mini-bar</option>
              <option value="amenity">Amenity</option>
              <option value="linen">ຜ້າ / Linen</option>
              <option value="cleaning">ນ້ຳຢາ / Cleaning</option>
              <option value="fnb">F&amp;B</option>
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="ສະຕັອກ">
              <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} min={0} />
            </Field>
            <Field label="Threshold" hint="alert ເມື່ອ ≤">
              <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} min={0} />
            </Field>
            <Field label="Unit">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, bottle, kg" />
            </Field>
          </div>
          <Field label="ລາຄາ (₭)" hint="ປ່ອຍວ່າງຖ້າບໍ່ມີລາຄາ">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} min={0} step={10} />
          </Field>
          {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        </form>
      </Modal>
    </>
  );
}
