import {requireStaff} from '@/lib/auth';
import {NextResponse} from 'next/server';
const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`,csv=(rows:any[][])=>rows.map(r=>r.map(esc).join(',')).join('\n'),one=(v:any)=>Array.isArray(v)?v[0]:v;
export async function GET(request:Request){
  const a=await requireStaff();if(!a)return NextResponse.json({error:'Forbidden'},{status:403});
  const u=new URL(request.url),kind=u.searchParams.get('kind'),from=u.searchParams.get('from')||'2000-01-01',to=u.searchParams.get('to')||'2100-01-01';let rows:any[][]=[];
  if(kind==='bookings'){
    const{data}=await a.supabase.from('bookings').select('code,status,check_in,check_out,total_amount,rooms(number,type),customers:customer_id(full_name)').gte('check_in',from).lte('check_in',to).neq('status','cancelled').order('check_in');
    rows=[['Code','Customer','Room','Type','Check in','Check out','Status','Amount'],...(data??[]).map((b:any)=>[b.code,one(b.customers)?.full_name,one(b.rooms)?.number,one(b.rooms)?.type,b.check_in,b.check_out,b.status,b.total_amount])];
  }else if(kind==='rooms'){
    const[{data:rooms},{data:bookings}]=await Promise.all([a.supabase.from('rooms').select('id,number,type,status').eq('active',true).order('number'),a.supabase.from('bookings').select('room_id,status').gte('check_in',from).lte('check_in',to).neq('status','cancelled')]);
    rows=[['Room','Type','Current status','Bookings','Actual stays'],...(rooms??[]).map((room:any)=>{const related=(bookings??[]).filter((b:any)=>b.room_id===room.id);return[room.number,room.type,room.status,related.length,related.filter((b:any)=>['checked_in','checked_out'].includes(b.status)).length]})];
  }else if(kind==='customers'){
    const{data}=await a.supabase.from('customers').select('full_name,email,phone,customer_type,active,created_at').gte('created_at',`${from}T00:00:00`).lte('created_at',`${to}T23:59:59`);rows=[['Name','Email','Phone','Type','Active','Created'],...(data??[]).map((x:any)=>[x.full_name,x.email,x.phone,x.customer_type,x.active,x.created_at])];
  }else return NextResponse.json({error:'Invalid report'},{status:400});
  return new Response('\ufeff'+csv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${kind}-${from}-${to}.csv"`}});
}
