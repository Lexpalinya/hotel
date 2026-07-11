import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ ok:false,error:'Forbidden' }, { status:403 });
  const { data,error } = await actor.supabase.rpc('staff_check_in', { p_booking_id: params.id });
  if (error) return NextResponse.json({ ok:false,error:error.message }, { status:422 });
  return NextResponse.json({ ok:true,data,error:null });
}
