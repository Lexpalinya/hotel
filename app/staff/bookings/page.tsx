import { createClient } from '@/lib/supabase-server';
import { WTopBar, BookingStatusPill } from '@/components/staff-bits';
import { formatKip, formatDateRange } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, code, check_in, check_out, guests, total_amount, status, rooms(number, type), users:guest_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <>
      <WTopBar
        title="ການຈອງ"
        sub={`${bookings?.length ?? 0} ລາຍການລ່າສຸດ`}
      />
      <div style={{ padding: 28 }}>
        <div className="h-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '120px 1.5fr 70px 1.3fr 60px 100px 110px',
            padding: '12px 22px', borderBottom: '1px solid var(--line)',
            background: 'var(--paper-2)', fontSize: 10, color: 'var(--ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
          }}>
            <span>BOOKING</span><span>ແຂກ</span><span>ຫ້ອງ</span><span>ວັນທີ</span><span>ຄົນ</span><span>ລວມ</span><span>ສະຖານະ</span>
          </div>
          {!bookings?.length && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ຍັງບໍ່ມີການຈອງ
            </div>
          )}
          {bookings?.map((b) => {
            const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
            const guest = Array.isArray(b.users) ? b.users[0] : b.users;
            return (
              <div key={b.id} style={{
                display: 'grid', gridTemplateColumns: '120px 1.5fr 70px 1.3fr 60px 100px 110px',
                padding: '14px 22px', borderTop: '1px solid var(--line-2)',
                fontSize: 13, alignItems: 'center',
              }}>
                <span className="h-mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>{b.code}</span>
                <span>
                  <div>{guest?.full_name ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{guest?.email ?? ''}</div>
                </span>
                <span className="h-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{room?.number ?? '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{formatDateRange(b.check_in, b.check_out)}</span>
                <span>{b.guests}</span>
                <span className="h-mono">{formatKip(b.total_amount)}</span>
                <span><BookingStatusPill status={b.status} /></span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
