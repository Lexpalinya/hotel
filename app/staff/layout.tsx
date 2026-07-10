import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import StaffShell from './shell';

const NAV = [
  { href: '/staff',            icon: '◐', label: 'ພາບລວມ', section: 'ຫຼັກ' },
  { href: '/staff/bookings',   icon: '☰', label: 'ຈອງຫ້ອງພັກ', section: 'ຈອງຫ້ອງພັກ' },
  { href: '/staff/rooms',      icon: '▦', label: 'ກວດສອບຫ້ອງ', section: 'ບໍລິການ' },
  { href: '/staff/room-types', icon: '▤', label: 'ປະເພດຫ້ອງ', section: 'ຂໍ້ມູນພື້ນຖານ' },
  { href: '/staff/guests',     icon: '○', label: 'ຂໍ້ມູນລູກຄ້າ' },
  { href: '/staff/employees',  icon: '◉', label: 'ຂໍ້ມູນພະນັກງານ' },
  { href: '/staff/floors',     icon: '≡', label: 'ຂໍ້ມູນຊັ້ນ' },
  { href: '/staff/reports',    icon: '⎘', label: 'ລາຍງານ', section: 'ລາຍງານ' },
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
