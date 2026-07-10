import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { WTopBar, BookingStatusPill, RoomStatusPill } from '@/components/staff-bits';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();
  const db = createClient();
  let bookings: any[] = [], rooms: any[] = [], users: any[] = [];
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, '')}%`;
    const [b, r, u] = await Promise.all([
      db.from('bookings').select('id,code,status,check_in,check_out,rooms(number),users:guest_id(full_name,email)').or(`code.ilike.${pattern},notes.ilike.${pattern}`).limit(30),
      db.from('rooms').select('id,number,type,status').or(`number.ilike.${pattern},type.ilike.${pattern}`).limit(30),
      db.from('users').select('id,full_name,email,phone,role').or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`).limit(30),
    ]); bookings = b.data ?? []; rooms = r.data ?? []; users = u.data ?? [];
  }
  return <><WTopBar title="ຄົ້ນຫາ" sub="ການຈອງ · ຫ້ອງ · ລູກຄ້າ" /><div style={{ padding: 'clamp(14px,3vw,28px)', display: 'grid', gap: 18 }}>
    <form style={{ display: 'flex', gap: 8 }}><input name="q" defaultValue={q} autoFocus placeholder="ລະຫັດຈອງ, ເລກຫ້ອງ, ຊື່, email, ເບີໂທ..." style={{ flex: 1 }} /><button className="h-btn h-btn--primary">ຄົ້ນຫາ</button></form>
    {q && <><Result title="ການຈອງ" count={bookings.length}>{bookings.map(b => { const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms; const user = Array.isArray(b.users) ? b.users[0] : b.users; return <Link key={b.id} href={`/staff/bookings/${b.id}`} style={row}><span className="h-mono">{b.code}</span><span>{user?.full_name || user?.email || 'Walk-in'}</span><span>ຫ້ອງ {room?.number}</span><BookingStatusPill status={b.status} /></Link>; })}</Result>
    <Result title="ຫ້ອງ" count={rooms.length}>{rooms.map(r => <Link key={r.id} href="/staff/rooms" style={row}><strong>ຫ້ອງ {r.number}</strong><span>{r.type}</span><RoomStatusPill status={r.status} /></Link>)}</Result>
    <Result title="ລູກຄ້າ / ພະນັກງານ" count={users.length}>{users.map(u => <div key={u.id} style={row}><strong>{u.full_name || '—'}</strong><span>{u.email}</span><span>{u.phone || '—'}</span><span>{u.role}</span></div>)}</Result></>}
  </div></>;
}
function Result({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="h-card" style={{ padding: 0, overflow: 'hidden' }}><div style={{ padding: '13px 18px', background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}><strong>{title}</strong> <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>({count})</span></div>{count ? children : <div style={{ padding: 20, color: 'var(--ink-3)', fontSize: 13 }}>ບໍ່ພົບຂໍ້ມູນ</div>}</section>; }
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--line-2)', alignItems: 'center', fontSize: 13, color: 'inherit' };
