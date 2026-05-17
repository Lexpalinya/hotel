import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function StayPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, code, status, check_in, check_out, total_amount, rooms(number, type, price_per_night), booking_charges(label, amount)')
    .eq('guest_id', user!.id)
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
  const charges = Array.isArray(b.booking_charges) ? b.booking_charges : [];
  const extras = charges.reduce((s, c) => s + c.amount, 0);

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
            <span style={{ color: 'var(--ink-2)' }}>
              ຄ່າຫ້ອງ <span className="h-pill h-pill--ok" style={{ marginLeft: 8, height: 16, fontSize: 9, padding: '0 6px' }}>ຈ່າຍແລ້ວ</span>
            </span>
            <span className="h-mono">{formatKip(b.total_amount)}</span>
          </div>
          {charges.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
              <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>
              <span className="h-mono">{formatKip(c.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--paper-2)', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>ຍອດຄ້າງຊຳລະ</span>
            <span className="h-mono" style={{ fontSize: 18, fontWeight: 600 }}>{formatKip(extras)}</span>
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto', padding: '12px 18px 14px',
        background: 'var(--paper)', borderTop: '1px solid var(--line)',
      }}>
        <form action={`/api/checkout/${b.id}`} method="POST">
          <button type="submit" className="h-btn h-btn--primary" style={{ width: '100%', height: 46 }}>
            Check Out + ຈ່າຍ {formatKip(extras)}
          </button>
        </form>
      </div>
    </div>
  );
}
