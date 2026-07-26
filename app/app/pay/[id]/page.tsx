import { createClient } from '@/lib/supabase-server';
import { formatKip } from '@/lib/format';
import { notFound, redirect } from 'next/navigation';
import PayPanel from './pay-panel';

export const dynamic = 'force-dynamic';

export default async function PayPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect(`/login?next=/app/pay/${params.id}`);
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, code, total_amount, status, rooms(number, type),payments(amount,status)')
    .eq('id', params.id)
    .eq('guest_id',user.id)
    .single();

  if (!booking) notFound();

  const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;
  const paid=(booking.payments??[]).filter((p:any)=>p.status==='paid').reduce((s:number,p:any)=>s+p.amount,0);
  const awaiting=(booking.payments??[]).some((p:any)=>p.status==='pending');
  const deposit=Math.ceil(booking.total_amount*.7),target=booking.status==='pending'?deposit:booking.total_amount,amount=Math.max(0,target-paid);
  if(!['pending','confirmed','checked_in'].includes(booking.status)||(!amount&&!awaiting))redirect('/app/history');

  return (
    <div style={{ background: '#f7f5f0', minHeight: '100vh' }}>
      <div style={{
        padding: '18px 18px 14px', borderBottom: '1px solid var(--line-2)',
      }}>
        <div className="h-serif" style={{ fontSize: 22 }}>ຈ່າຍເງິນ</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>PromptPay · ໃຊ້ແອັບທະນາຄານສະແກນ</div>
      </div>
      <div style={{ padding: '20px 18px 100px' }}>
        <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 22, border: '1px solid var(--line)', textAlign: 'center' }}>
          <div className="h-eyebrow" style={{ marginBottom: 4 }}>ຈຳນວນເງິນ</div>
          <div className="h-mono" style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {formatKip(amount)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}>.00</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {booking.code} · ຫ້ອງ {room?.number ?? '—'}
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:10}}>{booking.status==='pending'?`ມັດຈຳ 70% ຂອງ ${formatKip(booking.total_amount)}`:`ຍອດຄົງເຫຼືອຈາກ ${formatKip(booking.total_amount)}`}</div>
          {awaiting?<div className="h-pill h-pill--warn">ລໍຖ້າ Staff ກວດສອບການຊຳລະ</div>:<PayPanel bookingId={booking.id} amount={amount} />}
        </div>
      </div>
    </div>
  );
}
