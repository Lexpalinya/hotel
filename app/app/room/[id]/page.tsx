import { createClient } from '@/lib/supabase-server';
import { formatKip } from '@/lib/format';
import { notFound } from 'next/navigation';
import BookForm from './book-form';

export const dynamic = 'force-dynamic';

export default async function RoomDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: room } = await supabase.from('rooms').select('*').eq('id', params.id).single();
  if (!room) notFound();

  return (
    <div style={{ background: '#f7f5f0' }}>
      {room.image_url ? (
        <div style={{ width: '100%', height: 240, overflow: 'hidden', background: 'var(--paper-2)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={room.image_url} alt={`ຫ້ອງ ${room.number}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{
          height: 200, background: 'linear-gradient(135deg, var(--accent-soft), var(--paper-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-ink)', fontSize: 13, fontFamily: 'var(--font-mono)',
        }}>
          ROOM {room.number} · {room.type.toUpperCase()}
        </div>
      )}
      <div style={{ padding: '20px 18px 100px' }}>
        <div className="h-eyebrow" style={{ color: 'var(--accent)' }}>{room.type.toUpperCase()}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
          <div className="h-serif" style={{ fontSize: 28 }}>ຫ້ອງ <span className="h-mono">{room.number}</span></div>
          <div>
            <span className="h-mono" style={{ fontSize: 20, fontWeight: 600 }}>{formatKip(room.price_per_night)}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}> /ຄືນ</span>
          </div>
        </div>
        {room.description && (
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>{room.description}</div>
        )}

        {room.amenities?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="h-eyebrow" style={{ marginBottom: 8 }}>ສິ່ງອຳນວຍຄວາມສະດວກ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {room.amenities.map((a: string) => (
                <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span> {a}
                </div>
              ))}
            </div>
          </div>
        )}

        <BookForm room={room} />
      </div>
    </div>
  );
}
