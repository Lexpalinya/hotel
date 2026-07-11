import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
export async function POST(request:Request){
  const actor=await requireStaff(); if(!actor)return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const b=await request.json().catch(()=>null) as any; if(!b)return NextResponse.json({ok:false,error:'Invalid request'},{status:400});
  const {data,error}=await actor.supabase.rpc('staff_create_booking',{
    p_full_name:b.name,p_email:b.email||'',p_phone:b.phone||'',p_room_id:b.roomId,
    p_check_in:b.checkIn,p_check_out:b.checkOut,p_guests:Number(b.guests),
    p_mark_paid:b.paid===true,p_payment_method:b.method||'cash'
  });
  if(error){const conflict=error.code==='23P01'||error.message.includes('overlap');return NextResponse.json({ok:false,error:conflict?'Room is no longer available.':error.message},{status:conflict?409:422});}
  return NextResponse.json({ok:true,data,error:null},{status:201});
}
