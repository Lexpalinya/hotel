'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Field } from '@/components/modal';
import { formatKip } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types';

export default function AddPaymentButton({ bookingId, balance }: { bookingId: string; balance: number }) {
  const router = useRouter(); const [open,setOpen] = useState(false); const [pending,start] = useTransition();
  const [amount,setAmount] = useState(Math.max(0,balance)); const [method,setMethod] = useState<PaymentMethod>('cash'); const [ref,setRef] = useState(''); const [err,setErr] = useState('');
  const submit = (e:React.FormEvent) => { e.preventDefault(); if (amount <= 0 || amount > balance) return setErr('ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ'); start(async () => { const response=await fetch(`/api/staff/bookings/${bookingId}/payments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,method,reference:ref})});const result=await response.json();if(!response.ok)return setErr(result.error||'Payment failed'); setOpen(false); router.refresh(); }); };
  if(balance<=0)return null;
  return <><button className="h-btn h-btn--accent" onClick={() => setOpen(true)}>+ ຊຳລະເງິນ</button><Modal open={open} onClose={() => setOpen(false)} title="ບັນທຶກການຊຳລະ" sub={`ຄ້າງຊຳລະ ${formatKip(balance)}`} footer={<><button className="h-btn" onClick={() => setOpen(false)}>ຍົກເລີກ</button><button form="payment-form" className="h-btn h-btn--accent" disabled={pending}>ບັນທຶກ</button></>}><form id="payment-form" onSubmit={submit} style={{ display:'grid',gap:12 }}><Field label="ຈຳນວນ"><input type="number" min={1} max={balance} value={amount} onChange={e=>setAmount(Number(e.target.value))} /></Field><Field label="ວິທີຊຳລະ"><select value={method} onChange={e=>setMethod(e.target.value as PaymentMethod)}><option value="cash">ເງິນສົດ</option><option value="transfer">ໂອນ</option><option value="card">ບັດ</option><option value="promptpay">QR</option></select></Field><Field label="ເລກອ້າງອີງ"><input value={ref} onChange={e=>setRef(e.target.value)} /></Field>{err && <div style={{ color:'var(--danger)',fontSize:12 }}>{err}</div>}</form></Modal></>;
}
