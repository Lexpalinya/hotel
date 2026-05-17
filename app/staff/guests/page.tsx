import { createClient } from '@/lib/supabase-server';
import { WTopBar } from '@/components/staff-bits';

export const dynamic = 'force-dynamic';

export default async function GuestsPage() {
  const supabase = createClient();
  const { data: guests } = await supabase
    .from('users').select('*').eq('role', 'guest').order('created_at', { ascending: false });

  return (
    <>
      <WTopBar title="ແຂກ" sub={`${guests?.length ?? 0} ບັນຊີ`} />
      <div style={{ padding: 28 }}>
        <div className="h-card" style={{ padding: 0 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1.5fr 1.2fr 1.5fr 120px',
            padding: '12px 22px', background: 'var(--paper-2)',
            borderBottom: '1px solid var(--line)', fontSize: 10, color: 'var(--ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
          }}>
            <span></span><span>ຊື່</span><span>ປະເພດ</span><span>ຕິດຕໍ່</span><span>ສະຖານະ</span>
          </div>
          {!guests?.length && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ຍັງບໍ່ມີລູກຄ້າທີ່ສະໝັກ
            </div>
          )}
          {guests?.map((g) => (
            <div key={g.id} style={{
              display: 'grid', gridTemplateColumns: '60px 1.5fr 1.2fr 1.5fr 120px',
              padding: '14px 22px', borderTop: '1px solid var(--line-2)',
              fontSize: 13, alignItems: 'center',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 15, background: 'var(--accent-soft)',
                color: 'var(--accent-ink)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 600, fontSize: 12,
              }}>{(g.full_name || g.email || '?').charAt(0).toUpperCase()}</div>
              <span>{g.full_name || '—'}</span>
              <span style={{ color: 'var(--ink-2)' }}>{g.guest_type ?? 'guest'}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{g.email}</span>
              <span className="h-pill h-pill--ok"><span className="dot" />active</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
