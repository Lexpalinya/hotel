import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
export async function POST(request:Request){
  const actor=await getRequestActor(); if(!actor||actor.profile.role!=='guest')return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const body=await request.json().catch(()=>null) as {bookingId?:string;reference?:string}|null;
  if(!body?.bookingId)return NextResponse.json({ok:false,error:'Booking is required'},{status:400});
  const {data:b}=await actor.supabase.from('bookings').select('id,total_amount,status,payments(amount,status)').eq('id',body.bookingId).eq('guest_id',actor.user.id).single();
  if(!b)return NextResponse.json({ok:false,error:'Booking not found'},{status:404});
  if(!['pending','confirmed','checked_in'].includes(b.status))return NextResponse.json({ok:false,error:'Booking cannot accept payment'},{status:422});
  const paid=(b.payments??[]).filter((p:any)=>p.status==='paid').reduce((s:number,p:any)=>s+p.amount,0);
  if (b.status === 'confirmed') return NextResponse.json({ok:false,error:'Remaining payment is due at check-in'},{status:422});
  const deposit=Math.ceil(b.total_amount*.3),target=b.status==='pending'?deposit:b.total_amount,balance=Math.max(0,target-paid);if(!balance)return NextResponse.json({ok:false,error:'Required payment is already complete'},{status:409});
  const existing=(b.payments??[]).some((p:any)=>p.status==='pending'); if(existing)return NextResponse.json({ok:false,error:'Payment is already awaiting verification'},{status:409});
  const {data,error}=await actor.supabase.from('payments').insert({booking_id:b.id,amount:balance,method:'transfer',status:'pending',ref:body.reference||`CUSTOMER-${Date.now()}`,created_by:actor.user.id}).select('id,status,amount').single();
  if(error)return NextResponse.json({ok:false,error:error.message},{status:500});
  return NextResponse.json({ok:true,data,error:null},{status:201});
}
