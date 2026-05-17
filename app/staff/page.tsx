import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import { formatKip } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = createClient();

  const [
    { count: totalRooms },
    { count: occupiedRooms },
    { count: dirtyRooms },
    { data: arrivals },
    { data: revenueRows },
  ] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'dirty'),
    supabase.from('bookings')
      .select('id, code, check_in, guests, total_amount, status, rooms(number, type), users:guest_id(full_name)')
      .eq('check_in', new Date().toISOString().slice(0, 10))
      .order('created_at', { ascending: false }),
    supabase.from('payments').select('amount').eq('status', 'paid'),
  ]);

  const totalRevenue = (revenueRows ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const occupancy = totalRooms ? Math.round(((occupiedRooms ?? 0) / totalRooms) * 100) : 0;

  return (
    <>
      <WTopBar
        title="Dashboard"
        sub={`ພາບລວມໂຮງແຮມ · ${new Date().toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />
      <div style={{ padding: 28, display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Stat label="OCCUPANCY" value={`${occupancy}%`} hint={`${occupiedRooms ?? 0} / ${totalRooms ?? 0} ຫ້ອງ`} />
          <Stat label="ມາວັນນີ້" value={arrivals?.length ?? 0} hint="check-in ຄ້າງ" />
          <Stat label="ລໍຄວາມສະອາດ" value={dirtyRooms ?? 0} hint="ຫ້ອງລໍຖ້າທຳຄວາມສະອາດ" />
          <Stat label="ລາຍຮັບລວມ" value={formatKip(totalRevenue)} hint="ທັງໝົດ (ຈ່າຍແລ້ວ)" />
        </div>

        <div className="h-card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
            <div className="h-eyebrow">ເຊັກອິນມື້ນີ້</div>
            <div className="h-serif" style={{ fontSize: 18, marginTop: 2 }}>
              {arrivals?.length ?? 0} ລາຍການ
            </div>
          </div>
          {!arrivals?.length ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ບໍ່ມີ check-in ມື້ນີ້
            </div>
          ) : (
            <div>
              {arrivals.map((b) => {
                const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
                const guest = Array.isArray(b.users) ? b.users[0] : b.users;
                return (
                  <div key={b.id} style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 80px 60px 120px',
                    alignItems: 'center', gap: 16, padding: '14px 22px',
                    borderTop: '1px solid var(--line-2)', fontSize: 13,
                  }}>
                    <span className="h-mono" style={{ color: 'var(--ink-3)' }}>{b.code}</span>
                    <span>{guest?.full_name ?? '—'}</span>
                    <span className="h-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{room?.number ?? '—'}</span>
                    <span style={{ color: 'var(--ink-2)' }}>{b.guests} ຄົນ</span>
                    <span className="h-mono">{formatKip(b.total_amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
