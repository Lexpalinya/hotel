import Link from 'next/link';
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
    { count: pendingTasks },
    { data: lowStock },
  ] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'dirty'),
    supabase.from('bookings')
      .select('id, code, check_in, guests, total_amount, status, rooms(number, type), users:guest_id(full_name)')
      .eq('check_in', new Date().toISOString().slice(0, 10))
      .order('created_at', { ascending: false }),
    supabase.from('payments').select('amount').eq('status', 'paid'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done'),
    supabase.from('items').select('name, stock, threshold').filter('stock', 'lte', 'threshold').limit(5),
  ]);

  const totalRevenue = (revenueRows ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const occupancy = totalRooms ? Math.round(((occupiedRooms ?? 0) / totalRooms) * 100) : 0;
  const lowStockList = (lowStock ?? []).filter((i) => i.stock <= i.threshold);

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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
          <div className="h-card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="h-eyebrow">ເຊັກອິນມື້ນີ້</div>
                <div className="h-serif" style={{ fontSize: 18, marginTop: 2 }}>
                  {arrivals?.length ?? 0} ລາຍການ
                </div>
              </div>
              <Link href="/staff/bookings" className="h-btn" style={{ height: 30, fontSize: 12 }}>ເບິ່ງທັງໝົດ →</Link>
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
                    <Link key={b.id} href={`/staff/bookings/${b.id}`} style={{
                      display: 'grid', gridTemplateColumns: '120px 1fr 80px 60px 120px',
                      alignItems: 'center', gap: 16, padding: '14px 22px',
                      borderTop: '1px solid var(--line-2)', fontSize: 13,
                      textDecoration: 'none', color: 'var(--ink)',
                    }}>
                      <span className="h-mono" style={{ color: 'var(--ink-3)' }}>{b.code}</span>
                      <span>{guest?.full_name ?? '—'}</span>
                      <span className="h-mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{room?.number ?? '—'}</span>
                      <span style={{ color: 'var(--ink-2)' }}>{b.guests} ຄົນ</span>
                      <span className="h-mono">{formatKip(b.total_amount)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
            {/* Housekeeping summary */}
            <Link href="/staff/housekeeping" className="h-card" style={{ padding: '18px 22px', display: 'block', textDecoration: 'none', color: 'var(--ink)' }}>
              <div className="h-eyebrow" style={{ marginBottom: 8 }}>ງານແມ່ບ້ານ</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="h-mono" style={{ fontSize: 28, fontWeight: 600 }}>{pendingTasks ?? 0}</div>
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>→</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>ງານທີ່ຍັງຄ້າງ</div>
            </Link>

            {/* Low stock alert */}
            <div className="h-card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="h-eyebrow">ສະຕັອກໃກ້ໝົດ</div>
                <Link href="/staff/inventory" style={{ fontSize: 11, color: 'var(--accent)' }}>ດູ →</Link>
              </div>
              {!lowStockList.length ? (
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>ທຸກລາຍການມີສະຕັອກພຽງພໍ ✓</div>
              ) : (
                <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
                  {lowStockList.map((i, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{i.name}</span>
                      <span className="h-mono" style={{ color: 'var(--danger)' }}>{i.stock} / {i.threshold}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
