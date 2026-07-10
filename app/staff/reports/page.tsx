import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat, BookingStatusPill } from '@/components/staff-bits';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const db = createClient();
  const [{ data: bookings }, { data: charges }, { data: guests }, { data: payments }, { count: rooms }, { count: occupied }] = await Promise.all([
    db.from('bookings').select('id,code,status,check_in,check_out,total_amount,created_at,rooms(number,type),users:guest_id(full_name,email)').order('created_at', { ascending: false }).limit(200),
    db.from('booking_charges').select('id,label,amount,created_at,bookings(code,rooms(number))').order('created_at', { ascending: false }).limit(200),
    db.from('users').select('id,full_name,email,phone,guest_type,created_at').eq('role','guest').order('created_at', { ascending: false }),
    db.from('payments').select('amount,status'),
    db.from('rooms').select('id', { count: 'exact', head: true }),
    db.from('rooms').select('id', { count: 'exact', head: true }).eq('status','occupied'),
  ]);
  const revenue = (payments ?? []).filter(p => p.status === 'paid').reduce((s,p) => s + p.amount, 0);
  const serviceRevenue = (charges ?? []).reduce((s,c) => s + c.amount, 0);
  const occupancy = rooms ? Math.round(((occupied ?? 0) / rooms) * 100) : 0;
  return <><WTopBar title="ລາຍງານ" sub="ຂໍ້ມູນການຈອງ · ບໍລິການ · ລູກຄ້າ" /><div style={{ padding: 'clamp(14px,3vw,28px)', display: 'grid', gap: 22 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}><Stat label="OCCUPANCY" value={`${occupancy}%`} hint={`${occupied ?? 0}/${rooms ?? 0} ຫ້ອງ`} /><Stat label="REVENUE" value={formatKip(revenue)} hint="ຊຳລະແລ້ວ" /><Stat label="SERVICES" value={formatKip(serviceRevenue)} hint={`${charges?.length ?? 0} ລາຍການ`} /><Stat label="CUSTOMERS" value={guests?.length ?? 0} hint="ລູກຄ້າທັງໝົດ" /></div>
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><a className="h-btn" href="#bookings">ລາຍງານການຈອງພັກ</a><a className="h-btn" href="#services">ລາຍງານການບໍລິການ</a><a className="h-btn" href="#customers">ລາຍງານຂໍ້ມູນລູກຄ້າ</a></nav>
    <ReportSection id="bookings" title="ລາຍງານການຈອງພັກ" count={bookings?.length ?? 0}>{(bookings ?? []).map(b => { const room = one(b.rooms); const user = one(b.users); return <ReportRow key={b.id} cells={[b.code, user?.full_name || user?.email || 'Walk-in', `ຫ້ອງ ${room?.number || '—'}`, `${formatDateLao(b.check_in)} - ${formatDateLao(b.check_out)}`, formatKip(b.total_amount), <BookingStatusPill key="s" status={b.status} />]} />; })}</ReportSection>
    <ReportSection id="services" title="ລາຍງານການບໍລິການ" count={charges?.length ?? 0}>{(charges ?? []).map(c => { const booking = one(c.bookings); const room = one(booking?.rooms); return <ReportRow key={c.id} cells={[c.label, booking?.code || '—', `ຫ້ອງ ${room?.number || '—'}`, new Date(c.created_at).toLocaleString('lo-LA'), formatKip(c.amount)]} />; })}</ReportSection>
    <ReportSection id="customers" title="ລາຍງານຂໍ້ມູນລູກຄ້າ" count={guests?.length ?? 0}>{(guests ?? []).map(g => <ReportRow key={g.id} cells={[g.full_name || '—', g.email || '—', g.phone || '—', g.guest_type || 'guest', formatDateLao(g.created_at)]} />)}</ReportSection>
  </div></>;
}
function one(value: any) { return Array.isArray(value) ? value[0] : value; }
function ReportSection({ id,title,count,children }: { id:string; title:string; count:number; children:React.ReactNode }) { return <section id={id} className="h-card" style={{ padding: 0, overflow: 'auto', scrollMarginTop: 20 }}><div style={{ padding: '16px 18px', position: 'sticky', left: 0, borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}><strong>{title}</strong><span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 12 }}>{count} ລາຍການ</span></div><div style={{ minWidth: 760 }}>{count ? children : <div style={{ padding: 24, color: 'var(--ink-3)' }}>ຍັງບໍ່ມີຂໍ້ມູນ</div>}</div></section>; }
function ReportRow({ cells }: { cells: React.ReactNode[] }) { return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length},minmax(120px,1fr))`, gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--line-2)', fontSize: 12 }}>{cells.map((c,i) => <span key={i}>{c}</span>)}</div>; }
