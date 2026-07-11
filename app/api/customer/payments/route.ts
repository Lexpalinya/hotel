import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
export async function POST(request:Request){
  const actor=await getRequestActor(); if(!actor||actor.profile.role!=='guest')return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const body=await request.json().catch(()=>null) as {bookingId?:string;reference?:string}|null;
  if(!body?.bookingId)return NextResponse.json({ok:false,error:'Booking is required'},{status:400});
  const {data:b}=await actor.supabase.from('bookings').select('id,total_amount,status,booking_charges(amount,voided_at),payments(amount,status)').eq('id',body.bookingId).eq('guest_id',actor.user.id).single();
  if(!b)return NextResponse.json({ok:false,error:'Booking not found'},{status:404});
  const charges=(b.booking_charges??[]).filter((c:any)=>!c.voided_at).reduce((s:number,c:any)=>s+c.amount,0);
  const paid=(b.payments??[]).filter((p:any)=>p.status==='paid').reduce((s:number,p:any)=>s+p.amount,0);
  const balance=Math.max(0,b.total_amount+charges-paid); if(!balance)return NextResponse.json({ok:false,error:'Booking is already paid'},{status:409});
  const existing=(b.payments??[]).some((p:any)=>p.status==='pending'); if(existing)return NextResponse.json({ok:false,error:'Payment is already awaiting verification'},{status:409});
  const {data,error}=await actor.supabase.from('payments').insert({booking_id:b.id,amount:balance,method:'transfer',status:'pending',ref:body.reference||`CUSTOMER-${Date.now()}`,created_by:actor.user.id}).select('id,status,amount').single();
  if(error)return NextResponse.json({ok:false,error:error.message},{status:500});
  return NextResponse.json({ok:true,data,error:null},{status:201});
}
