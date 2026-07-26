import {requireStaff} from '@/lib/auth';
import {NextResponse} from 'next/server';
const esc=(v:any)=>`"${String(v??'').replace(/"/g,'""')}"`,csv=(rows:any[][])=>rows.map(r=>r.map(esc).join(',')).join('\n'),one=(v:any)=>Array.isArray(v)?v[0]:v;
const roomStatus:Record<string,string>={available:'ວ່າງ',reserved:'ຖືກຈອງ',occupied:'ມີຄົນພັກຢູ່',inspection:'ລໍກວດສອບຫ້ອງ',out_of_order:'ປິດສ້ອມ',dirty:'ລໍກວດສອບຫ້ອງ',cleaning:'ລໍກວດສອບຫ້ອງ'};
const bookingStatus:Record<string,string>={pending:'ລໍຊຳລະ',confirmed:'ຢືນຢັນແລ້ວ',checked_in:'ແຈ້ງເຂົ້າແລ້ວ',checked_out:'ແຈ້ງອອກແລ້ວ',cancelled:'ຍົກເລີກ'};
export async function GET(request:Request){
  const a=await requireStaff();if(!a)return NextResponse.json({error:'Forbidden'},{status:403});
  const u=new URL(request.url),kind=u.searchParams.get('kind'),from=u.searchParams.get('from')||'2000-01-01',to=u.searchParams.get('to')||'2100-01-01';let rows:any[][]=[];
  if(kind==='bookings'){
    const{data}=await a.supabase.from('bookings').select('code,status,check_in,check_out,total_amount,rooms(number,type),customers:customer_id(full_name)').gte('check_in',from).lte('check_in',to).neq('status','cancelled').order('check_in');
    rows=[['Code','Customer','Room','Type','Check in','Check out','Status','Amount'],...(data??[]).map((b:any)=>[b.code,one(b.customers)?.full_name,one(b.rooms)?.number,one(b.rooms)?.type,b.check_in,b.check_out,bookingStatus[b.status]||b.status,b.total_amount])];
  }else if(kind==='rooms'){
    const[{data:rooms},{data:bookings}]=await Promise.all([a.supabase.from('rooms').select('id,number,type,status').eq('active',true).order('number'),a.supabase.from('bookings').select('room_id,status').gte('check_in',from).lte('check_in',to).neq('status','cancelled')]);
    rows=[['Room','Type','Current status','Bookings','Actual stays'],...(rooms??[]).map((room:any)=>{const related=(bookings??[]).filter((b:any)=>b.room_id===room.id);return[room.number,room.type,roomStatus[room.status]||room.status,related.length,related.filter((b:any)=>['checked_in','checked_out'].includes(b.status)).length]})];
  }else if(kind==='stays'){
    const{data}=await a.supabase.from('bookings').select('code,status,check_in,check_out,checked_in_at,checked_out_at,rooms(number,type),customers:customer_id(full_name),users:guest_id(full_name)').gte('check_in',from).lte('check_in',to).in('status',['checked_in','checked_out']).order('check_in');
    rows=[['Code','Customer','Room','Type','Planned check in','Planned check out','Actual check in','Actual check out','Status'],...(data??[]).map((b:any)=>[b.code,one(b.customers)?.full_name||one(b.users)?.full_name||'Walk-in',one(b.rooms)?.number,one(b.rooms)?.type,b.check_in,b.check_out,b.checked_in_at,b.checked_out_at,bookingStatus[b.status]||b.status])];
  }else if(kind==='revenue'){
    const{data}=await a.supabase.from('payments').select('amount,method,paid_at,ref,bookings(code,rooms(number),customers:customer_id(full_name),users:guest_id(full_name))').eq('status','paid').gte('paid_at',`${from}T00:00:00+07:00`).lte('paid_at',`${to}T23:59:59+07:00`).order('paid_at');
    rows=[['Paid at','Booking','Customer','Room','Method','Reference','Amount'],...(data??[]).map((p:any)=>{const b=one(p.bookings);return[p.paid_at,b?.code,one(b?.customers)?.full_name||one(b?.users)?.full_name||'Walk-in',one(b?.rooms)?.number,p.method,p.ref,p.amount]})];
  }else return NextResponse.json({error:'Invalid report'},{status:400});
  return new Response('\ufeff'+csv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${kind}-${from}-${to}.csv"`}});
}
