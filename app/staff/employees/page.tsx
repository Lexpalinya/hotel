import { createClient } from '@/lib/supabase-server';
import { WTopBar } from '@/components/staff-bits';
import EmployeeManager from './employee-manager';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function EmployeesPage() { const db = createClient(); const { data: { user } } = await db.auth.getUser(); const { data: me } = await db.from('users').select('role').eq('id', user!.id).single(); if (me?.role !== 'admin') redirect('/staff'); const { data } = await db.from('users').select('*').in('role', ['staff','admin']).order('full_name'); return <><WTopBar title="ຈັດການຂໍ້ມູນພະນັກງານ" sub={`${data?.length ?? 0} ຄົນ`} /><EmployeeManager employees={data ?? []} /></>; }
