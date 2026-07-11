import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
export async function POST(_:Request,{params}:{params:{id:string}}){
  const a=await getRequestActor();if(!a||a.profile.role!=='guest')return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const {data,error}=await a.supabase.from('bookings').update({status:'cancelled',cancelled_at:new Date().toISOString(),cancel_reason:'Cancelled by customer'}).eq('id',params.id).eq('guest_id',a.user.id).eq('status','pending').select('id').single();
  if(error||!data)return NextResponse.json({ok:false,error:'Only pending bookings can be cancelled'},{status:422});
  return NextResponse.json({ok:true,data,error:null});
}
