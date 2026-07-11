import { createClient } from '@/lib/supabase-server';
import { formatKip, formatDateRange } from '@/lib/format';
import CancelBookingButton from './cancel-booking-button';
import { BookingStatusPill } from '@/components/staff-bits';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, code, status, check_in, check_out, total_amount, rooms(number, type), payments(status)')
    .eq('guest_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--line-2)' }}>
        <div className="h-serif" style={{ fontSize: 22 }}>ປະຫວັດ</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{bookings?.length ?? 0} ການຈອງ</div>
      </div>
      <div style={{ padding: '18px' }}>
        {!bookings?.length && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            ຍັງບໍ່ມີການຈອງ
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookings?.map((b) => {
            const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
            return (
              <div key={b.id} className="h-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="h-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{b.code}</div>
                  <BookingStatusPill status={b.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'baseline' }}>
                  <div>
                    <div className="h-serif" style={{ fontSize: 18 }}>ຫ້ອງ {room?.number}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{formatDateRange(b.check_in, b.check_out)}</div>
                  </div>
                  <div className="h-mono" style={{ fontSize: 14, fontWeight: 600 }}>{formatKip(b.total_amount)}</div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>{b.status==='pending'&&!(b.payments??[]).some((p:any)=>p.status==='pending')&&<Link className="h-btn h-btn--accent" href={`/app/pay/${b.id}`}>ຊຳລະເງິນ 70%</Link>}{b.status==='pending'&&!(b.payments??[]).some((p:any)=>p.status==='paid')&&<CancelBookingButton id={b.id}/>} {(b.payments??[]).some((p:any)=>p.status==='pending')&&<span className="h-pill h-pill--warn">ລໍຖ້າ Staff ກວດສອບ</span>}{(b.payments??[]).some((p:any)=>p.status==='paid')&&<Link className="h-btn" href={`/app/receipt/${b.id}`}>ພິມໃບບິນ</Link>}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
