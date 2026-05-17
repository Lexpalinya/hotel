import { createClient } from '@/lib/supabase-server';
import { formatKip } from '@/lib/format';
import { notFound } from 'next/navigation';
import PayPanel from './pay-panel';

export const dynamic = 'force-dynamic';

export default async function PayPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, code, total_amount, status, rooms(number, type)')
    .eq('id', params.id)
    .single();

  if (!booking) notFound();

  const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;

  return (
    <div style={{ background: '#f7f5f0', minHeight: '100vh' }}>
      <div style={{
        padding: '18px 18px 14px', borderBottom: '1px solid var(--line-2)',
      }}>
        <div className="h-serif" style={{ fontSize: 22 }}>ຈ່າຍເງິນ</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>PromptPay · ໃຊ້ແອັບທະນາຄານສະແກນ</div>
      </div>
      <div style={{ padding: '20px 18px 100px' }}>
        <div style={{ background: 'var(--paper)', borderRadius: 16, padding: 22, border: '1px solid var(--line)', textAlign: 'center' }}>
          <div className="h-eyebrow" style={{ marginBottom: 4 }}>ຈຳນວນເງິນ</div>
          <div className="h-mono" style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {formatKip(booking.total_amount)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}>.00</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {booking.code} · ຫ້ອງ {room?.number ?? '—'}
          </div>
          <PayPanel bookingId={booking.id} amount={booking.total_amount} />
        </div>
        <div style={{
          marginTop: 18, background: 'var(--info-soft)', borderRadius: 10,
          padding: '12px 14px', fontSize: 12, color: 'oklch(0.32 0.06 230)', lineHeight: 1.5,
        }}>
          ໂໝດ MVP — ການຢືນຢັນເປັນ <strong>simulate</strong> · ໃນ production ຈະຕໍ່ກັບ PromptPay webhook ໂດຍກົງ
        </div>
      </div>
    </div>
  );
}
