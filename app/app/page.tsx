import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function GuestHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rooms }, { data: activeBookings }] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user!.id).single(),
    supabase.from('rooms').select('*').eq('status', 'available').order('price_per_night').limit(5),
    supabase
      .from('bookings')
      .select('id, code, status, check_in, check_out, total_amount, rooms(number, type)')
      .eq('guest_id', user!.id)
      .in('status', ['confirmed', 'checked_in'])
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const activeBooking = activeBookings?.[0];

  return (
    <div style={{ background: '#f7f5f0' }}>
      <div style={{
        padding: '18px 18px 12px', display: 'flex', alignItems: 'center',
        gap: 12, borderBottom: '1px solid var(--line-2)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-serif" style={{ fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            ສະບາຍດີ{profile?.full_name ? `, ${profile.full_name}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
            University Hotel · {new Date().toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: 'var(--accent-soft)',
          color: 'var(--accent-ink)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 600, fontSize: 13,
        }}>{(profile?.full_name ?? user!.email ?? '?').charAt(0).toUpperCase()}</div>
      </div>

      <div style={{ padding: '18px 18px 90px' }}>
        {activeBooking && (() => {
          const room = Array.isArray(activeBooking.rooms) ? activeBooking.rooms[0] : activeBooking.rooms;
          const isCheckedIn = activeBooking.status === 'checked_in';
          return (
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', borderRadius: 16, padding: 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div className="h-mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.1em' }}>
                    {isCheckedIn ? 'ກຳລັງເຂົ້າພັກ' : 'ການຈອງ'}
                  </div>
                  <div className="h-serif" style={{ fontSize: 24, marginTop: 4 }}>
                    ຫ້ອງ <span className="h-mono" style={{ fontWeight: 600 }}>{room?.number}</span>
                  </div>
                </div>
                <div className="h-pill" style={{
                  background: isCheckedIn ? 'oklch(0.30 0.07 40)' : 'oklch(0.30 0.07 150)',
                  color: isCheckedIn ? 'oklch(0.85 0.08 40)' : 'oklch(0.85 0.08 150)',
                }}>
                  <span className="dot" />
                  {isCheckedIn ? 'Checked in' : 'Confirmed'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 11, opacity: 0.85, marginBottom: 14 }}>
                <div>
                  <div style={{ opacity: 0.6 }}>ເຂົ້າພັກ</div>
                  <div className="h-mono" style={{ fontSize: 13, marginTop: 2 }}>{formatDateLao(activeBooking.check_in)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.6 }}>ອອກ</div>
                  <div className="h-mono" style={{ fontSize: 13, marginTop: 2 }}>{formatDateLao(activeBooking.check_out)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.6 }}>ລວມ</div>
                  <div className="h-mono" style={{ fontSize: 13, marginTop: 2 }}>{formatKip(activeBooking.total_amount)}</div>
                </div>
              </div>
              <Link href={isCheckedIn ? '/app/stay' : `/app/checkin/${activeBooking.id}`} style={{
                display: 'block', width: '100%', height: 38, borderRadius: 999,
                background: 'var(--accent)', color: 'white', border: 'none',
                fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'center', lineHeight: '38px',
              }}>
                {isCheckedIn ? 'ເບິ່ງລາຍລະອຽດ →' : 'ສະແດງ QR ສຳລັບເຊັກອິນ →'}
              </Link>
            </div>
          );
        })()}

        <div className="h-eyebrow" style={{ marginBottom: 10 }}>ຫ້ອງວ່າງ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!rooms?.length && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              ບໍ່ມີຫ້ອງວ່າງ
            </div>
          )}
          {rooms?.map((r) => (
            <Link key={r.id} href={`/app/room/${r.id}`} style={{
              background: 'var(--paper)', borderRadius: 12, padding: 10,
              border: '1px solid var(--line)', display: 'flex', gap: 12, cursor: 'pointer',
              textDecoration: 'none', color: 'var(--ink)',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 8, background: 'var(--accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--accent-ink)', fontFamily: 'var(--font-mono)',
              }}>ROOM</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="h-mono" style={{ fontSize: 14, fontWeight: 600 }}>{r.number}</div>
                  <div className="h-mono" style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatKip(r.price_per_night)}<span style={{ fontSize: 9, fontWeight: 400, color: 'var(--ink-3)' }}>/ຄືນ</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.type}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 3 }}>
                  {r.capacity} ຄົນ · {r.beds || '—'} · {r.amenities?.slice(0, 3).join(' · ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
