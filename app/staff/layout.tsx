import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

const NAV = [
  { href: '/staff', icon: '◐', label: 'Dashboard' },
  { href: '/staff/rooms', icon: '▦', label: 'ຕາລາງຫ້ອງ' },
  { href: '/staff/bookings', icon: '☰', label: 'ການຈອງ' },
  { href: '/staff/guests', icon: '◯', label: 'ແຂກ' },
  { href: '/staff/floors', icon: '≡', label: 'ຊັ້ນ' },
  { href: '/staff/reports', icon: '⎘', label: 'ລາຍງານ' },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/staff');

  const { data: profile } = await supabase
    .from('users').select('full_name, role').eq('id', user.id).single();

  // Auto-promote first user to staff (convenience for fresh setup; remove in prod).
  if (profile && profile.role === 'guest') {
    const { count } = await supabase.from('users')
      .select('id', { count: 'exact', head: true })
      .in('role', ['staff', 'admin']);
    if ((count ?? 0) === 0) {
      await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
    }
  }

  const displayName = profile?.full_name || user.email || '';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0eee9' }}>
      <aside style={{
        width: 220, background: 'oklch(0.22 0.012 60)',
        color: 'oklch(0.85 0.012 60)', display: 'flex', flexDirection: 'column',
        padding: '20px 14px',
      }}>
        <div style={{ padding: '0 8px 18px', borderBottom: '1px solid oklch(0.32 0.012 60)' }}>
          <div className="h-serif" style={{ fontSize: 18, color: 'white' }}>University Hotel</div>
          <div className="h-mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 4, letterSpacing: '0.1em' }}>STAFF · v1.0</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 12px', borderRadius: 8, fontSize: 13,
              color: 'oklch(0.78 0.012 60)',
            }}>
              <span style={{ fontSize: 14, width: 16, textAlign: 'center', opacity: 0.85 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: '12px 8px', display: 'flex', alignItems: 'center', gap: 10,
          borderTop: '1px solid oklch(0.32 0.012 60)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'white', fontWeight: 600,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: 10, opacity: 0.5 }}>{profile?.role || 'staff'}</div>
          </div>
          <a href="/api/logout" title="Sign out" style={{ color: 'oklch(0.78 0.012 60)', padding: 4 }}>↗</a>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
