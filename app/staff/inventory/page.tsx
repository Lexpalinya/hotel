import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import { formatKip } from '@/lib/format';
import AddItemButton from './add-item-button';
import StockButton from './stock-button';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = createClient();
  const { data: items } = await supabase.from('items').select('*').order('category').order('name');

  const lowStock = (items ?? []).filter((i) => i.stock <= i.threshold).length;
  const totalValue = (items ?? []).reduce((s, i) => s + (i.price ?? 0) * i.stock, 0);

  // Group by category
  const byCat = new Map<string, typeof items>();
  (items ?? []).forEach((i) => {
    const arr = byCat.get(i.category) ?? [];
    arr.push(i); byCat.set(i.category, arr);
  });

  const CAT_LABEL: Record<string, string> = {
    minibar: 'Mini-bar',
    amenity: 'Amenities',
    linen: 'ຜ້າ / Linen',
    cleaning: 'ນ້ຳຢາ / Cleaning',
    fnb: 'F&B',
  };

  return (
    <>
      <WTopBar
        title="ສະຕັອກ"
        sub={`${items?.length ?? 0} ລາຍການ · ${lowStock} ໃກ້ໝົດ`}
        actions={<AddItemButton />}
      />
      <div style={{ padding: 28, display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <Stat label="ລາຍການທັງໝົດ" value={items?.length ?? 0} />
          <Stat label="ໃກ້ໝົດ / ໝົດ" value={lowStock} hint="stock ≤ threshold" />
          <Stat label="ມູນຄ່າສະຕັອກ" value={formatKip(totalValue)} hint="ຄຳນວນຈາກ price × stock" />
        </div>

        {Array.from(byCat.entries()).map(([cat, list]) => (
          <div key={cat} className="h-card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--line)' }}>
              <div className="h-eyebrow">{CAT_LABEL[cat] ?? cat}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{list?.length ?? 0} ລາຍການ</div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1.5fr 80px 80px 80px 100px 140px',
              padding: '10px 22px', background: 'var(--paper-2)',
              fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase',
              letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
            }}>
              <span>SKU</span><span>ຊື່</span><span>STOCK</span><span>THRESHOLD</span><span>UNIT</span><span>ລາຄາ</span><span></span>
            </div>
            {list?.map((it) => (
              <div key={it.id} style={{
                display: 'grid', gridTemplateColumns: '120px 1.5fr 80px 80px 80px 100px 140px',
                padding: '12px 22px', borderTop: '1px solid var(--line-2)',
                fontSize: 13, alignItems: 'center',
              }}>
                <span className="h-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{it.sku}</span>
                <span>{it.name}</span>
                <span className="h-mono" style={{
                  fontWeight: 600,
                  color: it.stock <= it.threshold ? 'var(--danger)' : 'var(--ink)',
                }}>{it.stock}</span>
                <span className="h-mono" style={{ color: 'var(--ink-3)' }}>{it.threshold}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{it.unit}</span>
                <span className="h-mono">{it.price ? formatKip(it.price) : '—'}</span>
                <StockButton item={it} />
              </div>
            ))}
          </div>
        ))}

        {!items?.length && (
          <div className="h-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
            ຍັງບໍ່ມີສິນຄ້າ — ກົດ "+ ເພີ່ມສິນຄ້າ" ດ້ານເທິງ
          </div>
        )}
      </div>
    </>
  );
}
