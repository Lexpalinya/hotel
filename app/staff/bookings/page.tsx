import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { WTopBar, BookingStatusPill } from '@/components/staff-bits';
import { formatKip, formatDateRange } from '@/lib/format';
import NewBookingButton from './new-booking-button';
import BookingActions from './booking-actions';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = createClient();
  const [{ data: bookings }, { data: rooms }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, code, check_in, check_out, guests, total_amount, status, room_id, notes, rooms(number, type), users:guest_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('rooms').select('*').order('number'),
  ]);

  return (
    <>
      <WTopBar
        title="ການຈອງ"
        sub={`${bookings?.length ?? 0} ລາຍການລ່າສຸດ`}
        actions={<NewBookingButton rooms={rooms ?? []} />}
      />
      <div style={{ padding: 'clamp(14px, 3vw, 28px)' }}>
        <div className="h-card" style={{ padding: 0, overflow: 'auto' }}>
          <div style={{ minWidth: 920 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '120px 1.5fr 70px 1.3fr 60px 100px 110px 100px',
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-2)', fontSize: 10, color: 'var(--ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
          }}>
            <span>BOOKING</span><span>ແຂກ</span><span>ຫ້ອງ</span><span>ວັນທີ</span><span>ຄົນ</span><span>ລວມ</span><span>ສະຖານະ</span><span></span>
          </div>
          {!bookings?.length && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ຍັງບໍ່ມີການຈອງ — ກົດ "+ ຈອງໃໝ່" ດ້ານເທິງ
            </div>
          )}
          {bookings?.map((b) => {
            const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
            const guest = Array.isArray(b.users) ? b.users[0] : b.users;
            // For walk-ins (no guest_id), parse name from notes "Walk-in: <name> · ..."
            const walkinName = !guest && b.notes?.startsWith('Walk-in:')
              ? b.notes.replace('Walk-in:', '').split('·')[0].trim()
              : null;
            return (
              <div key={b.id} style={{
                display: 'grid', gridTemplateColumns: '120px 1.5fr 70px 1.3fr 60px 100px 110px 100px',
                padding: '14px 22px', borderTop: '1px solid var(--line-2)',
                fontSize: 13, alignItems: 'center',
              }}>
                <Link href={`/staff/bookings/${b.id}`} className="h-mono" style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'underline' }}>{b.code}</Link>
                <span>
                  <div>{guest?.full_name ?? walkinName ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {guest?.email ?? (walkinName ? 'walk-in' : '')}
                  </div>
                </span>
                <span className="h-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{room?.number ?? '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{formatDateRange(b.check_in, b.check_out)}</span>
                <span>{b.guests}</span>
                <span className="h-mono">{formatKip(b.total_amount)}</span>
                <span><BookingStatusPill status={b.status} /></span>
                <span><BookingActions id={b.id} status={b.status} roomId={b.room_id} /></span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </>
  );
}
