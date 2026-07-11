import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { QRish } from '@/components/qr';

export const dynamic = 'force-dynamic';

export default async function CheckinScreen({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, code, status, rooms(number)')
    .eq('id', params.id)
    .single();
  if (!booking) notFound();

  const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 18px 14px' }}>
        <div className="h-mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.1em' }}>SELF CHECK-IN</div>
        <div className="h-serif" style={{ fontSize: 20 }}>ສະແກນທີ່ເຄົາເຕີ</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <QRish seed={booking.code} size={240} />
        <div className="h-mono" style={{ marginTop: 22, fontSize: 11, opacity: 0.6, letterSpacing: '0.15em' }}>BOOKING ID</div>
        <div className="h-mono" style={{ fontSize: 16, marginTop: 4, letterSpacing: '0.05em' }}>{booking.code}</div>
        <div style={{
          marginTop: 28, padding: '14px 18px', background: 'rgba(255,255,255,0.05)',
          borderRadius: 12, fontSize: 12, lineHeight: 1.55, maxWidth: 280,
          textAlign: 'center', opacity: 0.85,
        }}>
          ນຳ QR ນີ້ໄປສະແດງທີ່ເຄົາເຕີລ໋ອບບີ້<br/>ພະນັກງານຈະມອບບັດກະແຈຫ້ອງ {' '}
          <span className="h-mono">{room?.number ?? '—'}</span> ໃຫ້
        </div>
      </div>
    </div>
  );
}
