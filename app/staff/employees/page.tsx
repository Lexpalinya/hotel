import { createClient } from '@/lib/supabase-server';
import { WTopBar } from '@/components/staff-bits';
import EmployeeManager from './employee-manager';
export const dynamic = 'force-dynamic';
export default async function EmployeesPage() { const db = createClient(); const { data } = await db.from('users').select('*').in('role', ['staff','admin']).order('full_name'); return <><WTopBar title="ຈັດການຂໍ້ມູນພະນັກງານ" sub={`${data?.length ?? 0} ຄົນ`} /><EmployeeManager employees={data ?? []} /></>; }
