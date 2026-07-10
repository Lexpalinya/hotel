'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type NavItem = { href: string; icon: string; label: string; section?: string };

export default function StaffShell({
  nav, displayName, role, children,
}: {
  nav: NavItem[];
  displayName: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const currentLabel = nav.find((n) => n.href === pathname || (n.href !== '/staff' && pathname.startsWith(n.href)))?.label ?? 'ໂຮງແຮມສຸນັນທາ';

  return (
    <div className="staff-shell">
      {/* Mobile top bar */}
      <div className="staff-mobile-bar">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'transparent', border: 'none',
            color: 'white', cursor: 'pointer', fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {open ? '✕' : '☰'}
        </button>
        <div className="h-serif" style={{ fontSize: 16, color: 'white' }}>{currentLabel}</div>
        <a href="/api/logout" title="Sign out" style={{ color: 'oklch(0.78 0.012 60)', padding: 4 }}>↗</a>
      </div>

      {/* Backdrop for mobile drawer */}
      <div className={`staff-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`staff-sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '0 8px 18px', borderBottom: '1px solid oklch(0.32 0.012 60)' }}>
          <div className="h-serif" style={{ fontSize: 18, color: 'white' }}>ໂຮງແຮມສຸນັນທາ</div>
          <div className="h-mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 4, letterSpacing: '0.1em' }}>
            STAFF · v1.0
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
          {nav.map((item) => {
            const active = item.href === pathname || (item.href !== '/staff' && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
              {item.section && <div style={{ padding: '14px 12px 5px', fontSize: 9, opacity: 0.42, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.section}</div>}
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, fontSize: 13,
                background: active ? 'oklch(0.32 0.012 60)' : 'transparent',
                color: active ? 'white' : 'oklch(0.78 0.012 60)',
                fontWeight: active ? 500 : 400,
                transition: 'background .12s, color .12s',
              }}>
                <span style={{ fontSize: 14, width: 16, textAlign: 'center', opacity: 0.85 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
              </div>
            );
          })}
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
            <div style={{ fontSize: 12, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, opacity: 0.5 }}>{role}</div>
          </div>
          <a href="/api/logout" title="Sign out" style={{ color: 'oklch(0.78 0.012 60)', padding: 4 }}>↗</a>
        </div>
      </aside>

      <main className="staff-main">{children}</main>
    </div>
  );
}
