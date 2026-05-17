import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import StaffShell from './shell';

const NAV = [
  { href: '/staff',              icon: '◐', label: 'Dashboard' },
  { href: '/staff/rooms',        icon: '▦', label: 'ຕາລາງຫ້ອງ' },
  { href: '/staff/bookings',     icon: '☰', label: 'ການຈອງ' },
  { href: '/staff/guests',       icon: '◯', label: 'ແຂກ' },
  { href: '/staff/housekeeping', icon: '✲', label: 'ແມ່ບ້ານ' },
  { href: '/staff/inventory',    icon: '▤', label: 'ສະຕັອກ' },
  { href: '/staff/floors',       icon: '≡', label: 'ຊັ້ນ' },
  { href: '/staff/reports',      icon: '⎘', label: 'ລາຍງານ' },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/staff');

  const { data: profile } = await supabase
    .from('users').select('full_name, role').eq('id', user.id).single();

  // Auto-promote first user to staff (convenience for fresh setup).
  if (profile && profile.role === 'guest') {
    const { count } = await supabase.from('users')
      .select('id', { count: 'exact', head: true })
      .in('role', ['staff', 'admin']);
    if ((count ?? 0) === 0) {
      await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
    }
  }

  const displayName = profile?.full_name || user.email || '';
  const role = profile?.role || 'staff';

  return (
    <StaffShell nav={NAV} displayName={displayName} role={role}>
      {children}
    </StaffShell>
  );
}
