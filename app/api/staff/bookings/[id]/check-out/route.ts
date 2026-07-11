import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireStaff();
  if (!actor) return NextResponse.json({ ok:false,error:'Forbidden' }, { status:403 });
  const body = await request.json().catch(() => ({})) as { allowBalance?: boolean };
  const { data,error } = await actor.supabase.rpc('staff_check_out', { p_booking_id: params.id, p_allow_balance: body.allowBalance === true });
  if (error) return NextResponse.json({ ok:false,error:error.message }, { status:422 });
  return NextResponse.json({ ok:true,data,error:null });
}
