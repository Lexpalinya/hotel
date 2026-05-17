import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GuestNav from './guest-nav';

const TABS = [
  { href: '/app',         icon: '◉', label: 'ໜ້າຫຼັກ' },
  { href: '/app/stay',    icon: '◫', label: 'ຫ້ອງຂອງຂ້ອຍ' },
  { href: '/app/history', icon: '✕', label: 'ປະຫວັດ' },
  { href: '/app/profile', icon: '○', label: 'ໂປຣໄຟລ໌' },
];

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/app');

  const { data: profile } = await supabase
    .from('users').select('full_name').eq('id', user.id).single();
  const displayName = profile?.full_name || user.email || '';

  return (
    <div className="app-shell">
      {/* Top nav (desktop only) */}
      <header className="app-top-nav" style={{
        background: 'rgba(247,245,240,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line-2)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
          <Link href="/app" className="h-serif" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>ໂຮງແຮມສຸນັນທາ</Link>
          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {TABS.map((t) => (
              <GuestNav key={t.href} href={t.href} icon={t.icon} label={t.label} variant="top" />
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{displayName}</span>
            <Link href="/app/profile" style={{
              width: 36, height: 36, borderRadius: 18, background: 'var(--accent-soft)',
              color: 'var(--accent-ink)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 600, fontSize: 14,
            }}>
              {(displayName || '?').charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 76 }}>{children}</div>

      {/* Bottom nav (mobile only) */}
      <nav className="app-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        alignItems: 'flex-start',
        background: 'rgba(247,245,240,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line-2)',
        zIndex: 5,
      }}>
        {TABS.map((t) => (
          <GuestNav key={t.href} href={t.href} icon={t.icon} label={t.label} variant="bottom" />
        ))}
      </nav>
    </div>
  );
}
