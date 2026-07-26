import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import StaffShell from './shell';

const NAV = [
  { href: '/staff',            icon: '◐', label: 'ພາບລວມ', section: 'ຫຼັກ' },
  { href: '/staff/registrations', icon: '◎', label: 'ການລົງທະບຽນ', section: 'ການລົງທະບຽນ' },
  { href: '/staff/rooms',      icon: '▦', label: 'ຈັດການຂໍ້ມູນຫ້ອງ', section: 'ຂໍ້ມູນພື້ນຖານ' },
  { href: '/staff/room-types', icon: '▤', label: 'ຈັດການປະເພດຫ້ອງ' },
  { href: '/staff/guests',     icon: '○', label: 'ຈັດການລູກຄ້າ' },
  { href: '/staff/employees',  icon: '◉', label: 'ຈັດການພະນັກງານ' },
  { href: '/staff/floors',     icon: '≡', label: 'ຂໍ້ມູນຊັ້ນ' },
  { href: '/staff/bookings',   icon: '☰', label: 'ຈັດການການຈອງ', section: 'ການຈອງ ແລະ ເຂົ້າ-ອອກ' },
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
    <StaffShell nav={role === 'admin' ? NAV : NAV.filter(item => !['/staff/employees','/staff/registrations'].includes(item.href))} displayName={displayName} role={role}>
      {children}
    </StaffShell>
  );
}
