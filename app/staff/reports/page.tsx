import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat, BookingStatusPill, RoomStatusPill } from '@/components/staff-bits';
import { formatKip, formatDateLao } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({searchParams}:{searchParams:{from?:string;to?:string}}) {
  const db=createClient();
  const now=new Date(),from=searchParams.from||new Date(now.getFullYear(),0,1).toISOString().slice(0,10),to=searchParams.to||now.toISOString().slice(0,10);
  const [{data:bookings},{data:rooms},{data:guests},{data:payments},{count:occupied}]=await Promise.all([
    db.from('bookings').select('id,code,room_id,status,check_in,check_out,total_amount,rooms(number,type),users:guest_id(full_name,email),customers:customer_id(full_name,email)').gte('check_in',from).lte('check_in',to).order('check_in',{ascending:false}).limit(1000),
    db.from('rooms').select('id,number,type,status').eq('active',true).order('number'),
    db.from('customers').select('id,full_name,email,phone,customer_type,created_at').gte('created_at',`${from}T00:00:00`).lte('created_at',`${to}T23:59:59`).order('created_at',{ascending:false}),
    db.from('payments').select('amount,status,paid_at').eq('status','paid').gte('paid_at',`${from}T00:00:00+07:00`).lte('paid_at',`${to}T23:59:59+07:00`),
    db.from('rooms').select('id',{count:'exact',head:true}).eq('active',true).eq('status','occupied'),
  ]);
  const valid=(bookings??[]).filter(b=>b.status!=='cancelled');
  const usedStatuses=new Set(['checked_in','checked_out']);
  const roomStats=(rooms??[]).map(room=>{const related=valid.filter(b=>b.room_id===room.id);return{...room,bookings:related.length,uses:related.filter(b=>usedStatuses.has(b.status)).length,revenue:related.reduce((s,b)=>s+b.total_amount,0)}}).sort((a,b)=>b.uses-a.uses||b.bookings-a.bookings||a.number.localeCompare(b.number));
  const typeMap=new Map<string,{type:string;rooms:number;bookings:number;uses:number}>();
  for(const room of roomStats){const row=typeMap.get(room.type)||{type:room.type,rooms:0,bookings:0,uses:0};row.rooms++;row.bookings+=room.bookings;row.uses+=room.uses;typeMap.set(room.type,row)}
  const typeStats=[...typeMap.values()].sort((a,b)=>b.uses-a.uses||b.bookings-a.bookings);
  const revenue=(payments??[]).reduce((s,p)=>s+p.amount,0),occupancy=rooms?.length?Math.round(((occupied??0)/rooms.length)*100):0;

  return <><WTopBar title="ລາຍງານ" sub="ການຈອງ · ຫ້ອງ · ລູກຄ້າ"/><div style={{padding:'clamp(14px,3vw,28px)',display:'grid',gap:22}}>
    <form className="h-card" style={{padding:14,display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}><label style={{display:'grid',gap:4,fontSize:10}}>FROM<input type="date" name="from" defaultValue={from}/></label><label style={{display:'grid',gap:4,fontSize:10}}>TO<input type="date" name="to" defaultValue={to}/></label><button className="h-btn h-btn--primary">Apply</button><a className="h-btn" href="/staff/reports">Clear</a></form>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}><Stat label="OCCUPANCY" value={`${occupancy}%`} hint={`${occupied??0}/${rooms?.length??0} ຫ້ອງ`}/><Stat label="REVENUE" value={formatKip(revenue)} hint="ຕາມຊ່ວງວັນ"/><Stat label="ROOM BOOKINGS" value={valid.length} hint={`${roomStats.length} ຫ້ອງ`}/><Stat label="CUSTOMERS" value={guests?.length??0} hint="ລູກຄ້າໃໝ່"/></div>
    <nav style={{display:'flex',gap:8,flexWrap:'wrap'}}><a className="h-btn" href="#bookings">ລາຍງານການຈອງພັກ</a><a className="h-btn" href="#rooms">ລາຍງານຫ້ອງ</a><a className="h-btn" href="#customers">ລາຍງານຂໍ້ມູນລູກຄ້າ</a><a className="h-btn h-btn--accent" href={`/api/staff/reports/export?kind=bookings&from=${from}&to=${to}`}>CSV Bookings</a><a className="h-btn h-btn--accent" href={`/api/staff/reports/export?kind=rooms&from=${from}&to=${to}`}>CSV Rooms</a><a className="h-btn h-btn--accent" href={`/api/staff/reports/export?kind=customers&from=${from}&to=${to}`}>CSV Customers</a></nav>
    <ReportSection id="bookings" title="ລາຍງານການຈອງພັກ" count={valid.length}>{valid.map(b=>{const room=one(b.rooms),customer=one(b.customers)||one(b.users);return <ReportRow key={b.id} cells={[b.code,customer?.full_name||customer?.email||'Walk-in',`ຫ້ອງ ${room?.number||'—'}`,`${formatDateLao(b.check_in)} - ${formatDateLao(b.check_out)}`,formatKip(b.total_amount),<BookingStatusPill key="s" status={b.status}/>]}/>})}</ReportSection>
    <section id="rooms" style={{display:'grid',gap:14,scrollMarginTop:20}}><ReportSection id="room-types" title="ຈຳນວນຫ້ອງຕາມປະເພດ" count={typeStats.length}><ReportRow header cells={['ປະເພດ','ຈຳນວນຫ້ອງ','ຍອດຈອງ','ເຂົ້າໃຊ້ງານ']}/>{typeStats.map(x=><ReportRow key={x.type} cells={[x.type,x.rooms,x.bookings,x.uses]}/>)}</ReportSection><ReportSection id="room-ranking" title="ອັນດັບການຈອງ ແລະ ເຂົ້າໃຊ້ຫ້ອງ" count={roomStats.length}><ReportRow header cells={['ຫ້ອງ','ປະເພດ','ສະຖານະ','ຍອດຈອງ','ເຂົ້າໃຊ້ງານ']}/>{roomStats.map((x,i)=><ReportRow key={x.id} cells={[`${i+1}. ຫ້ອງ ${x.number}`,x.type,<RoomStatusPill key="status" status={x.status}/>,x.bookings,x.uses]}/>)}</ReportSection></section>
    <ReportSection id="customers" title="ລາຍງານຂໍ້ມູນລູກຄ້າ" count={guests?.length??0}>{(guests??[]).map(g=><ReportRow key={g.id} cells={[g.full_name||'—',g.email||'—',g.phone||'—',g.customer_type||'guest',formatDateLao(g.created_at)]}/>)}</ReportSection>
  </div></>;
}
function one(value:any){return Array.isArray(value)?value[0]:value}
function ReportSection({id,title,count,children}:{id:string;title:string;count:number;children:React.ReactNode}){return <section id={id} className="h-card" style={{padding:0,overflow:'auto',scrollMarginTop:20}}><div style={{padding:'16px 18px',position:'sticky',left:0,borderBottom:'1px solid var(--line)',background:'var(--paper-2)'}}><strong>{title}</strong><span style={{marginLeft:8,color:'var(--ink-3)',fontSize:12}}>{count} ລາຍການ</span></div><div style={{minWidth:680}}>{count?children:<div style={{padding:24,color:'var(--ink-3)'}}>ຍັງບໍ່ມີຂໍ້ມູນ</div>}</div></section>}
function ReportRow({cells,header=false}:{cells:React.ReactNode[];header?:boolean}){return <div style={{display:'grid',gridTemplateColumns:`repeat(${cells.length},minmax(110px,1fr))`,gap:12,alignItems:'center',padding:'12px 18px',borderBottom:'1px solid var(--line-2)',fontSize:12,fontWeight:header?600:400,background:header?'var(--paper-2)':undefined}}>{cells.map((c,i)=><span key={i}>{c}</span>)}</div>}
