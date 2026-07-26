import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function StayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/app/stay');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, code, status, check_in, check_out, total_amount, rooms(number, type, price_per_night), payments(amount,status)')
    .eq('guest_id', user.id)
    .eq('status', 'checked_in')
    .order('created_at', { ascending: false })
    .limit(1);

  const b = bookings?.[0];
  if (!b) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-3)' }}>
        <div className="h-serif" style={{ fontSize: 20, color: 'var(--ink)' }}>ຍັງບໍ່ໄດ້ເຂົ້າພັກ</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>ກັບໄປ <Link href="/app" style={{ color: 'var(--accent)' }}>ໜ້າຫຼັກ</Link></div>
      </div>
    );
  }

  const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
  const paid = (b.payments ?? [])
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const awaitingPayment = (b.payments ?? []).some((payment) => payment.status === 'pending');
  const balance = Math.max(0, b.total_amount - paid);

  return (
    <div style={{ background: '#f7f5f0' }}>
      <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--line-2)' }}>
        <div className="h-serif" style={{ fontSize: 22 }}>ຫ້ອງຂອງທ່ານ</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>ກຳລັງເຂົ້າພັກ</div>
      </div>
      <div style={{ padding: '18px 18px 160px' }}>
        <div className="h-card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div className="h-serif" style={{ fontSize: 32 }}>ຫ້ອງ <span className="h-mono" style={{ fontWeight: 600 }}>{room?.number}</span></div>
            <div className="h-pill h-pill--accent"><span className="dot" />Checked in</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{room?.type}</div>
          <div style={{ marginTop: 16, borderTop: '1px solid var(--line-2)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontSize: 10, color: 'var(--ink-3)' }}>CHECK-IN</div><div className="h-mono" style={{ fontSize: 13, marginTop: 2 }}>{formatDateLao(b.check_in)}</div></div>
            <div><div style={{ fontSize: 10, color: 'var(--ink-3)' }}>CHECK-OUT</div><div className="h-mono" style={{ fontSize: 13, marginTop: 2 }}>{formatDateLao(b.check_out)}</div></div>
          </div>
        </div>

        <div className="h-eyebrow" style={{ marginBottom: 8 }}>ຄ່າໃຊ້ຈ່າຍ</div>
        <div className="h-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)' }}>ຄ່າຫ້ອງທັງໝົດ</span>
            <span className="h-mono">{formatKip(b.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)' }}>ຊຳລະແລ້ວ</span>
            <span className="h-mono">{formatKip(paid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
            <span>ຍອດຄົງເຫຼືອ</span>
            <span className="h-mono">{formatKip(balance)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {balance > 0 && !awaitingPayment && (
            <Link href={`/app/pay/${b.id}`} className="h-btn h-btn--accent">ຊຳລະຍອດຄົງເຫຼືອ</Link>
          )}
          {awaitingPayment && <span className="h-pill h-pill--warn">ລໍຖ້າ Staff ກວດສອບ</span>}
          {paid > 0 && <Link href={`/app/receipt/${b.id}`} className="h-btn">ພິມໃບບິນ</Link>}
        </div>
      </div>

    </div>
  );
}
