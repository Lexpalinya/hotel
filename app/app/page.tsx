import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function GuestHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rooms }, { data: activeBookings }] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user!.id).single(),
    supabase.from('rooms').select('*').eq('status', 'available').order('price_per_night').limit(12),
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
    <>
      {/* Mobile header (hidden on desktop — desktop has top nav with name) */}
      <div className="only-mobile" style={{
        padding: '18px 18px 12px', display: 'flex', alignItems: 'center',
        gap: 12, borderBottom: '1px solid var(--line-2)', background: '#f7f5f0',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-serif" style={{ fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            ສະບາຍດີ{profile?.full_name ? `, ${profile.full_name}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
            ໂຮງແຮມສຸນັນທາ · {new Date().toLocaleDateString('lo-LA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: 'var(--accent-soft)',
          color: 'var(--accent-ink)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 600, fontSize: 13,
        }}>{(profile?.full_name ?? user!.email ?? '?').charAt(0).toUpperCase()}</div>
      </div>

      {/* Desktop hero (hidden on mobile) */}
      <div className="only-desktop app-container" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>ສະບາຍດີ{profile?.full_name ? `, ${profile.full_name}` : ''}</div>
        <h1 className="h-serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          ຄົ້ນຫາຫ້ອງ ແລະ ຈອງ<br/>
          <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>ໂຮງແຮມສຸນັນທາ</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: 560, marginTop: 14, lineHeight: 1.55 }}>
          ໂຮງແຮມຂອງມະຫາວິທະຍາໄລ · ສຳລັບອາຈານ, ສິດເກົ່າ, ແຂກຂອງໜ່ວຍງານ ແລະ ນັກສຶກສາ
        </p>
      </div>

      <div className="app-container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        {/* Active booking card */}
        {activeBooking && (() => {
          const room = Array.isArray(activeBooking.rooms) ? activeBooking.rooms[0] : activeBooking.rooms;
          const isCheckedIn = activeBooking.status === 'checked_in';
          return (
            <div style={{
              background: 'var(--ink)', color: 'var(--paper)',
              borderRadius: 16, padding: 'clamp(16px, 3vw, 24px)', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div className="h-mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.1em' }}>
                    {isCheckedIn ? 'ກຳລັງເຂົ້າພັກ' : 'ການຈອງປະຈຸບັນ'}
                  </div>
                  <div className="h-serif" style={{ fontSize: 'clamp(22px, 3vw, 28px)', marginTop: 4 }}>
                    ຫ້ອງ <span className="h-mono" style={{ fontWeight: 600 }}>{room?.number}</span>
                    {room?.type && <span style={{ color: 'oklch(0.75 0.012 60)', fontStyle: 'italic', marginLeft: 8, fontSize: 16 }}>{room.type}</span>}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, fontSize: 11, opacity: 0.85, marginBottom: 16 }}>
                <div>
                  <div style={{ opacity: 0.6 }}>ເຂົ້າພັກ</div>
                  <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatDateLao(activeBooking.check_in)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.6 }}>ອອກ</div>
                  <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatDateLao(activeBooking.check_out)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.6 }}>ລວມ</div>
                  <div className="h-mono" style={{ fontSize: 14, marginTop: 2 }}>{formatKip(activeBooking.total_amount)}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.6 }}>BOOKING</div>
                  <div className="h-mono" style={{ fontSize: 12, marginTop: 2 }}>{activeBooking.code}</div>
                </div>
              </div>
              <Link href={isCheckedIn ? '/app/stay' : `/app/checkin/${activeBooking.id}`} style={{
                display: 'inline-block', minWidth: 200, height: 40, borderRadius: 999,
                background: 'var(--accent)', color: 'white',
                fontWeight: 500, fontSize: 13, textAlign: 'center',
                lineHeight: '40px', padding: '0 24px',
              }}>
                {isCheckedIn ? 'ເບິ່ງລາຍລະອຽດ →' : 'ສະແດງ QR ສຳລັບເຊັກອິນ →'}
              </Link>
            </div>
          );
        })()}

        {/* Rooms grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 className="h-serif" style={{ fontSize: 22, margin: 0, letterSpacing: '-0.01em' }}>ຫ້ອງວ່າງ</h2>
          <span className="h-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{rooms?.length ?? 0} ຫ້ອງ</span>
        </div>
        {!rooms?.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line)' }}>
            ບໍ່ມີຫ້ອງວ່າງໃນຕອນນີ້
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 14,
          }}>
            {rooms.map((r) => (
              <Link key={r.id} href={`/app/room/${r.id}`}
                className="h-card-hover"
                style={{
                  background: 'var(--paper)', borderRadius: 14, overflow: 'hidden',
                  border: '1px solid var(--line)', display: 'flex', flexDirection: 'column',
                  textDecoration: 'none', color: 'var(--ink)',
                }}>
                <div style={{
                  width: '100%', aspectRatio: '4 / 3', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--accent-soft), var(--paper-2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-ink)', fontFamily: 'var(--font-mono)', fontSize: 12,
                }}>
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt={`ຫ້ອງ ${r.number}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : `ROOM ${r.number}`}
                </div>
                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div className="h-mono" style={{ fontSize: 16, fontWeight: 600 }}>{r.number}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="h-mono" style={{ fontSize: 15, fontWeight: 600 }}>{formatKip(r.price_per_night)}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>/ ຄືນ</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 'auto' }}>
                    {r.capacity} ຄົນ · {r.beds || '—'}
                  </div>
                  {r.amenities?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {r.amenities.slice(0, 3).map((a: string) => (
                        <span key={a} className="h-pill" style={{ height: 18, fontSize: 10, padding: '0 7px' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
