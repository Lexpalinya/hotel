import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import { formatKip } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = createClient();

  const [
    { count: totalBookings },
    { data: paidPayments },
    { count: occupiedRooms },
    { count: totalRooms },
  ] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'paid'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
  ]);

  const totalRev = (paidPayments ?? []).reduce((s, p) => s + p.amount, 0);
  const occupancy = totalRooms ? Math.round(((occupiedRooms ?? 0) / totalRooms) * 100) : 0;
  const avgPerBooking = totalBookings ? Math.round(totalRev / (totalBookings || 1)) : 0;

  return (
    <>
      <WTopBar title="ລາຍງານ" sub="ສະຫຼຸບໂດຍລວມ" />
      <div style={{ padding: 'clamp(14px, 3vw, 28px)', display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Stat label="OCCUPANCY" value={`${occupancy}%`} hint={`${occupiedRooms ?? 0} / ${totalRooms ?? 0}`} />
          <Stat label="REVENUE" value={formatKip(totalRev)} hint="ຈ່າຍແລ້ວທັງໝົດ" />
          <Stat label="BOOKINGS" value={totalBookings ?? 0} hint="ທັງໝົດ" />
          <Stat label="AVG / BOOKING" value={formatKip(avgPerBooking)} hint="ຄ່າສະເລ່ຍ" />
        </div>
        <div className="h-card" style={{ padding: 28, color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
          ກຣາຟ + breakdown ລາຍຫ້ອງ/ປະເພດ — phase 2
        </div>
      </div>
    </>
  );
}
