import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { formatKip, formatDateLao } from '@/lib/format';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

export default async function Receipt({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms(number, type, price_per_night),
      customers:customer_id(full_name, email, phone),
      users:guest_id(full_name, email, phone),
      booking_charges(label, amount, created_at),
      payments(amount, method, status, paid_at, ref)
    `)
    .eq('id', params.id)
    .single();

  if (!booking) notFound();

  const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;
  const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
  const profile = Array.isArray(booking.users) ? booking.users[0] : booking.users;
  const guest = customer ?? profile;
  const charges = booking.booking_charges ?? [];
  const payments = (booking.payments ?? []).filter((p: { status: string }) => p.status === 'paid');

  const chargesTotal = charges.reduce((s: number, c: { amount: number }) => s + c.amount, 0);
  const paidTotal = payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  const grand = booking.total_amount + chargesTotal;
  const balance = grand - paidTotal;

  const walkinName = !guest && booking.notes?.startsWith('Walk-in:')
    ? booking.notes.replace('Walk-in:', '').split('·')[0].trim()
    : null;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 16mm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div style={{ background: 'white', minHeight: '100vh', padding: 40, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
        <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 24, maxWidth: 720, margin: '0 auto 24px' }}>
          <PrintButton />
          <a href={`/staff/bookings/${booking.id}`} className="h-btn">← ກັບໄປ booking</a>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', padding: '40px 48px', border: '1px solid var(--line)', borderRadius: 8 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--ink)' }}>
            <div>
              <div className="h-serif" style={{ fontSize: 28, letterSpacing: '-0.01em' }}>ໂຮງແຮມສຸນັນທາ</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                Sunantha Hotel · ໃບເສັດຮັບເງິນ
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="h-eyebrow">RECEIPT</div>
              <div className="h-mono" style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{booking.code}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                {new Date().toLocaleString('lo-LA')}
              </div>
            </div>
          </div>

          {/* Guest + booking */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 8 }}>BILL TO</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{guest?.full_name ?? walkinName ?? '—'}</div>
              {guest?.email && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{guest.email}</div>}
              {guest?.phone && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{guest.phone}</div>}
            </div>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 8 }}>STAY</div>
              <div style={{ fontSize: 14 }}>
                ຫ້ອງ <span className="h-mono" style={{ fontWeight: 600 }}>{room?.number}</span> · {room?.type}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                {formatDateLao(booking.check_in)} → {formatDateLao(booking.check_out)} · {booking.guests} ຄົນ
              </div>
            </div>
          </div>

          {/* Line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={th}>ລາຍການ</th>
                <th style={{ ...th, textAlign: 'right' }}>ຈຳນວນ</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--line-2)' }}>
                <td style={td}>ຄ່າຫ້ອງ {room?.number ?? ''} ({room?.type ?? ''})</td>
                <td style={{ ...td, textAlign: 'right' }} className="h-mono">{formatKip(booking.total_amount)}</td>
              </tr>
              {charges.map((c: { label: string; amount: number; created_at: string }, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--line-2)' }}>
                  <td style={td}>{c.label}</td>
                  <td style={{ ...td, textAlign: 'right' }} className="h-mono">{formatKip(c.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...td, fontWeight: 600, paddingTop: 16, borderTop: '2px solid var(--ink)' }}>ລວມທັງໝົດ</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600, paddingTop: 16, borderTop: '2px solid var(--ink)', fontSize: 16 }} className="h-mono">{formatKip(grand)}</td>
              </tr>
              <tr>
                <td style={{ ...td, color: 'var(--ink-3)' }}>ຈ່າຍແລ້ວ</td>
                <td style={{ ...td, textAlign: 'right', color: 'var(--ok)' }} className="h-mono">{formatKip(paidTotal)}</td>
              </tr>
              {balance !== 0 && (
                <tr>
                  <td style={{ ...td, fontWeight: 600, color: balance > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                    {balance > 0 ? 'ຄ້າງຊຳລະ' : 'ເງິນຄືນ'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: balance > 0 ? 'var(--danger)' : 'var(--ok)' }} className="h-mono">
                    {formatKip(Math.abs(balance))}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>

          {/* Payments */}
          {payments.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div className="h-eyebrow" style={{ marginBottom: 8 }}>PAYMENTS</div>
              {payments.map((p: { method: string; amount: number; paid_at: string | null; ref: string | null }, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-2)' }}>
                  <span>{p.paid_at ? new Date(p.paid_at).toLocaleString('lo-LA') : ''} · {p.method.toUpperCase()} {p.ref ? `· ${p.ref}` : ''}</span>
                  <span className="h-mono">{formatKip(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ paddingTop: 24, borderTop: '1px solid var(--line-2)', textAlign: 'center', fontSize: 11, color: 'var(--ink-3)' }}>
            ຂອບໃຈ · Thank you for staying with us
          </div>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 0',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--ink-3)',
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
};
const td: React.CSSProperties = {
  padding: '8px 0',
  fontSize: 13,
};
