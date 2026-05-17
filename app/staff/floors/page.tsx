import { createClient } from '@/lib/supabase-server';
import { WTopBar } from '@/components/staff-bits';

export const dynamic = 'force-dynamic';

export default async function FloorsPage() {
  const supabase = createClient();
  const [{ data: floors }, { data: rooms }] = await Promise.all([
    supabase.from('floors').select('*').order('number', { ascending: false }),
    supabase.from('rooms').select('id, floor_id, type'),
  ]);

  return (
    <>
      <WTopBar title="ຊັ້ນ + ໂຄງສ້າງອາຄານ"
        sub={`${floors?.length ?? 0} ຊັ້ນ · ${rooms?.length ?? 0} ຫ້ອງລວມ`} />
      <div style={{ padding: 28, display: 'grid', gap: 14 }}>
        {floors?.map((f) => {
          const fr = (rooms ?? []).filter((r) => r.floor_id === f.id);
          const typeCounts = fr.reduce<Record<string, number>>((acc, r) => {
            acc[r.type] = (acc[r.type] ?? 0) + 1; return acc;
          }, {});
          return (
            <div key={f.id} className="h-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="h-mono" style={{
                width: 48, height: 48, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600,
              }}>F{f.number}</div>
              <div style={{ flex: 1 }}>
                <div className="h-serif" style={{ fontSize: 18 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                  {f.purposes.join(' · ') || '—'} · {fr.length} ຫ້ອງ
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(typeCounts).map(([t, n]) => (
                  <span key={t} className="h-pill">
                    {t} <span className="h-mono" style={{ marginLeft: 4 }}>{n}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
