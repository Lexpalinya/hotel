import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', background: '#f7f5f0',
      minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, paddingBottom: 76, overflow: 'auto' }}>{children}</div>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
        maxWidth: 480, margin: '0 auto', paddingBottom: 12,
        display: 'flex', alignItems: 'flex-start',
        background: 'rgba(247,245,240,0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line-2)',
        zIndex: 5,
      }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, padding: '6px 0',
            color: 'var(--ink-3)',
          }}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
