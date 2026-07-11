import {NextResponse} from 'next/server';
import {requireStaff} from '@/lib/auth';
export async function POST(request:Request,{params}:{params:{id:string}}){
  const a=await requireStaff();if(!a)return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const body=await request.json().catch(()=>null) as {amount?:number;method?:string;reference?:string}|null;
  const {data:b}=await a.supabase.from('bookings').select('id,total_amount,payments(amount,status)').eq('id',params.id).single();if(!b)return NextResponse.json({ok:false,error:'Booking not found'},{status:404});
  if((b.payments??[]).some((p:any)=>p.status==='pending'))return NextResponse.json({ok:false,error:'Payment is already awaiting verification'},{status:409});
  const paid=(b.payments??[]).filter((p:any)=>p.status==='paid').reduce((s:number,p:any)=>s+p.amount,0),amount=Number(body?.amount),balance=b.total_amount-paid;
  if(!Number.isFinite(amount)||amount<=0||amount>balance)return NextResponse.json({ok:false,error:'Invalid payment amount'},{status:422});
  const now=new Date().toISOString();const {data,error}=await a.supabase.from('payments').insert({booking_id:b.id,amount,method:body?.method||'cash',status:'paid',paid_at:now,verified_at:now,verified_by:a.user.id,created_by:a.user.id,ref:body?.reference||null}).select('id').single();
  if(error)return NextResponse.json({ok:false,error:error.message},{status:409});
  if(paid+amount>=Math.ceil(b.total_amount*.7))await a.supabase.from('bookings').update({status:'confirmed'}).eq('id',b.id).eq('status','pending');
  return NextResponse.json({ok:true,data,error:null},{status:201});
}
