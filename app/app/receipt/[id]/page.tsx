import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { formatKip, formatDateLao } from '@/lib/format';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

export default async function CustomerReceipt({ params }: { params: { id: string } }) {
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/app/receipt/${params.id}`);

  const { data: booking } = await db.from('bookings').select(`
    id,code,check_in,check_out,total_amount,
    rooms(number,type),
    customers:customer_id(full_name,email,phone),
    users:guest_id(full_name,email,phone),
    payments(amount,method,status,paid_at,ref)
  `).eq('id', params.id).eq('guest_id', user.id).single();
  if (!booking) notFound();

  const paid = (booking.payments ?? []).filter((p: any) => p.status === 'paid');
  if (!paid.length) notFound();
  const room = one(booking.rooms);
  const customer = one(booking.customers) || one(booking.users);
  const paidTotal = paid.reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const balance = Math.max(0, booking.total_amount - paidTotal);

  return <div style={{background:'white',minHeight:'100vh',padding:'clamp(16px,4vw,40px)',color:'var(--ink)'}}>
    <style>{`@media print{.no-print{display:none!important}@page{margin:16mm}}`}</style>
    <div className="no-print" style={{maxWidth:720,margin:'0 auto 16px'}}><PrintButton/></div>
    <main style={{maxWidth:720,margin:'auto',border:'1px solid var(--line)',padding:'clamp(20px,5vw,48px)'}}>
      <header style={{display:'flex',justifyContent:'space-between',gap:16,borderBottom:'2px solid var(--ink)',paddingBottom:20,marginBottom:24}}>
        <div><h1 className="h-serif" style={{margin:0,fontSize:28}}>ໂຮງແຮມສຸນັນທາ</h1><small>ໃບເສັດຮັບເງິນ</small></div><strong className="h-mono">{booking.code}</strong>
      </header>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:24,marginBottom:24}}>
        <div><div className="h-eyebrow">CUSTOMER</div><strong>{customer?.full_name || user.email}</strong><div>{customer?.email}</div><div>{customer?.phone}</div></div>
        <div><div className="h-eyebrow">STAY</div><strong>ຫ້ອງ {room?.number} · {room?.type}</strong><div>{formatDateLao(booking.check_in)} - {formatDateLao(booking.check_out)}</div></div>
      </div>
      <div style={line}><span>ຄ່າຫ້ອງທັງໝົດ</span><span>{formatKip(booking.total_amount)}</span></div>
      <div style={{...line,fontWeight:700}}><span>ຊຳລະແລ້ວ</span><span>{formatKip(paidTotal)}</span></div>
      <div style={line}><span>ຍອດຄົງເຫຼືອ</span><span>{formatKip(balance)}</span></div>
    </main>
  </div>;
}

function one(value: any) { return Array.isArray(value) ? value[0] : value; }
const line: React.CSSProperties = {display:'flex',justifyContent:'space-between',gap:12,padding:'10px 0',borderBottom:'1px solid var(--line-2)',fontSize:13};
