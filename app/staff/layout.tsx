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
  const effectiveRole = profile?.role;

  if (!profile || !effectiveRole || !['staff', 'admin'].includes(effectiveRole)) redirect('/app');

  const displayName = profile?.full_name || user.email || '';
  const role = effectiveRole;

  return (
    <StaffShell nav={role === 'admin' ? NAV : NAV.filter(item => item.href !== '/staff/employees')} displayName={displayName} role={role}>
      {children}
    </StaffShell>
  );
}
