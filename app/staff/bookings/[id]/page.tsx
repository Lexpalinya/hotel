import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WTopBar, BookingStatusPill } from '@/components/staff-bits';
import { formatKip, formatDateRange, formatDateLao } from '@/lib/format';
import BookingEditButtons from './edit-buttons';
import AddPaymentButton from './add-payment-button';
import VerifyPaymentButton from './verify-payment-button';
import MoveRoomButton from './move-room-button';

export const dynamic = 'force-dynamic';

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms(*),
      customers:customer_id(full_name, email, phone),
      users:guest_id(full_name, email, phone),
      payments(*)
    `)
    .eq('id', params.id)
    .single();

  if (!booking) notFound();

  const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;
  const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
  const profile = Array.isArray(booking.users) ? booking.users[0] : booking.users;
  const guest = customer ?? profile;
  const payments = booking.payments ?? [];

  const paidTotal = payments.filter((p: { status: string }) => p.status === 'paid').reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  const balance = booking.total_amount - paidTotal;

  const walkinName = !guest && booking.notes?.startsWith('Walk-in:')
    ? booking.notes.replace('Walk-in:', '').split('·')[0].trim()
    : null;

  return (
    <>
      <WTopBar
        title={booking.code}
        sub={`ສ້າງເມື່ອ ${new Date(booking.created_at).toLocaleString('lo-LA')}`}
        actions={
          <>
            <Link href={`/staff/receipt/${booking.id}`} target="_blank" className="h-btn">ໃບເສັດ / Print</Link>
            <Link href="/staff/bookings" className="h-btn">← ກັບ</Link>
          </>
        }
      />
      <div className="booking-detail-2col" style={{ padding: 'clamp(14px, 3vw, 28px)', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 22 }}>
        {/* LEFT: details */}
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="h-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div className="h-eyebrow">BOOKING</div>
                <div className="h-serif" style={{ fontSize: 26, marginTop: 4 }}>
                  ຫ້ອງ <span className="h-mono">{room?.number ?? '—'}</span> · {room?.type ?? '—'}
                </div>
              </div>
              <BookingStatusPill status={booking.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '18px 0', borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>CHECK-IN</div>
                <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatDateLao(booking.check_in)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>CHECK-OUT</div>
                <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatDateLao(booking.check_out)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>ຄົນ</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{booking.guests}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>ຄ່າຫ້ອງ</div>
                <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatKip(booking.total_amount)}</div>
              </div>
            </div>

            <BookingEditButtons booking={booking} />
            <div style={{marginTop:8}}><MoveRoomButton bookingId={booking.id} checkIn={booking.check_in} checkOut={booking.check_out} guests={booking.guests}/></div>
          </div>

          {/* PAYMENTS */}
          <div className="h-card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="h-eyebrow">ການຈ່າຍ</div>
              <AddPaymentButton bookingId={booking.id} balance={balance} />
            </div>
            {!payments.length ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                ຍັງບໍ່ມີການຈ່າຍ
              </div>
            ) : (
              payments.map((p: { id: string; method: string; status: string; amount: number; paid_at: string | null; ref: string | null }) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px auto auto',
                  padding: '12px 22px', borderTop: '1px solid var(--line-2)',
                  fontSize: 13, alignItems: 'center',
                }}>
                  <div>
                    <div style={{ textTransform: 'uppercase', fontSize: 11, color: 'var(--ink-3)' }}>{p.method}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleString('lo-LA') : '—'} · {p.ref || ''}
                    </div>
                  </div>
                  <span className={`h-pill ${p.status === 'paid' ? 'h-pill--ok' : 'h-pill--warn'}`}>
                    <span className="dot" />{p.status}
                  </span>
                  <span className="h-mono">{formatKip(p.amount)}</span>
                  {p.status === 'pending' && <VerifyPaymentButton id={p.id} />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: guest + totals */}
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <div className="h-card" style={{ padding: 22 }}>
            <div className="h-eyebrow" style={{ marginBottom: 12 }}>ແຂກ</div>
            <div className="h-serif" style={{ fontSize: 18 }}>{guest?.full_name ?? walkinName ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
              {guest ? (
                <>
                  <div>{guest.email}</div>
                  {guest.phone && <div>{guest.phone}</div>}
                </>
              ) : (
                <div style={{ color: 'var(--warn)' }}>Walk-in (ບໍ່ມີບັນຊີ)</div>
              )}
            </div>
            {booking.notes && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 12, padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 6 }}>
                {booking.notes}
              </div>
            )}
          </div>

          <div className="h-card" style={{ padding: 22 }}>
            <div className="h-eyebrow" style={{ marginBottom: 12 }}>ສະຫຼຸບ</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <Row label="ຄ່າຫ້ອງ" value={formatKip(booking.total_amount)} />
              <div style={{ borderTop: '1px solid var(--line-2)', paddingTop: 8 }} />
              <Row label="ຈ່າຍແລ້ວ" value={formatKip(paidTotal)} />
              <Row label="ຄ້າງຊຳລະ" value={formatKip(balance)} bold danger={balance > 0} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--ink-2)' }}>{label}</span>
      <span className="h-mono" style={{
        fontWeight: bold ? 600 : 400,
        color: danger ? 'var(--danger)' : 'inherit',
      }}>{value}</span>
    </div>
  );
}
