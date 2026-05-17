'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GuestNav({
  href, icon, label, variant,
}: { href: string; icon: string; label: string; variant: 'top' | 'bottom' }) {
  const pathname = usePathname();
  const active = href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  if (variant === 'top') {
    return (
      <Link href={href} style={{
        padding: '8px 14px', borderRadius: 8,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'background .12s',
      }}>
        {label}
      </Link>
    );
  }

  return (
    <Link href={href} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, padding: '6px 0',
      color: active ? 'var(--accent)' : 'var(--ink-3)',
    }}>
      <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </Link>
  );
}
