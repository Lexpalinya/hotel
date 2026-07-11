import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import { formatKip } from '@/lib/format';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  noStore();
  const supabase = createClient();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Vientiane', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const dayStart = new Date(`${today}T00:00:00+07:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59.999+07:00`).toISOString();

  const [
    { count: totalRooms },
    { count: occupiedRooms },
    { data: arrivals },
    { count: departures },
    { count: pendingPayments },
    { data: revenueRows },
  ] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'checked_in'),
    supabase.from('bookings')
      .select('id, code, check_in, guests, total_amount, status, rooms(number, type), customers:customer_id(full_name), users:guest_id(full_name)')
      .eq('check_in', today)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('check_out', today).eq('status', 'checked_in'),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', dayStart).lte('paid_at', dayEnd),
  ]);

  const totalRevenue = (revenueRows ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const occupancy = totalRooms ? Math.round(((occupiedRooms ?? 0) / totalRooms) * 100) : 0;

  return (
    <>
      <WTopBar
        title="Dashboard"
        sub={`ພາບລວມໂຮງແຮມ · ${new Date().toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />
      <div style={{ padding: 'clamp(14px, 3vw, 28px)', display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Stat label="OCCUPANCY" value={`${occupancy}%`} hint={`${occupiedRooms ?? 0} / ${totalRooms ?? 0} ຫ້ອງ`} />
          <Stat label="ລໍ CHECK-IN ມື້ນີ້" value={arrivals?.length ?? 0} hint="ຢືນຢັນແລ້ວ" />
          <Stat label="ລໍ CHECK-OUT ມື້ນີ້" value={departures ?? 0} hint="ກຳລັງເຂົ້າພັກ" />
          <Stat label="ລໍກວດກາຊຳລະ" value={pendingPayments ?? 0} hint="ລາຍການ" />
          <Stat label="ລາຍຮັບມື້ນີ້" value={formatKip(totalRevenue)} hint="ຮັບເງິນແລ້ວ" />
        </div>

        <div>
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
                  const customer = Array.isArray(b.customers) ? b.customers[0] : b.customers;
                  const profile = Array.isArray(b.users) ? b.users[0] : b.users;
                  const guest = customer ?? profile;
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

        </div>
      </div>
    </>
  );
}
