import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import { formatDateLao } from '@/lib/format';

export const dynamic='force-dynamic';
export default async function RegistrationsPage(){
  const db=createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)redirect('/login?next=/staff/registrations');
  const {data:actor}=await db.from('users').select('role').eq('id',user.id).single();
  if(actor?.role!=='admin')redirect('/staff');
  const [{data:customers,count:customerCount},{data:employees,count:employeeCount}]=await Promise.all([
    db.from('customers').select('id,full_name,email,phone,customer_type,active,created_at',{count:'exact'}).eq('active',true).order('created_at',{ascending:false}).limit(20),
    db.from('users').select('id,full_name,email,phone,role,active,created_at',{count:'exact'}).in('role',['staff','admin']).order('created_at',{ascending:false}).limit(20),
  ]);
  return <><WTopBar title="ການລົງທະບຽນ" sub="ລູກຄ້າ ແລະ ພະນັກງານ" actions={<div style={{display:'flex',gap:8}}><Link href="/staff/guests" className="h-btn h-btn--primary">+ ລູກຄ້າ</Link><Link href="/staff/employees" className="h-btn h-btn--accent">+ ພະນັກງານ</Link></div>}/><div style={{padding:'clamp(14px,3vw,28px)',display:'grid',gap:18}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><Stat label="CUSTOMERS" value={customerCount??0} hint="ບັນຊີລູກຄ້າ"/><Stat label="EMPLOYEES" value={employeeCount??0} hint="Staff / Admin"/></div>
    <RegistrationTable title="ລູກຄ້າລົງທະບຽນລ່າສຸດ" rows={(customers??[]).map(x=>({id:x.id,name:x.full_name,email:x.email,phone:x.phone,type:x.customer_type||'visitor',created_at:x.created_at}))}/>
    <RegistrationTable title="ພະນັກງານລົງທະບຽນລ່າສຸດ" rows={(employees??[]).map(x=>({id:x.id,name:x.full_name,email:x.email,phone:x.phone,type:x.role,created_at:x.created_at}))}/>
  </div></>;
}
function RegistrationTable({title,rows}:{title:string;rows:{id:string;name:string|null;email:string|null;phone:string|null;type:string|null;created_at:string}[]}){return <section className="h-card" style={{overflow:'auto'}}><div style={{padding:'15px 18px',borderBottom:'1px solid var(--line)',fontWeight:600}}>{title}</div><div style={{minWidth:680}}><div style={rowStyle}><strong>ຊື່</strong><strong>Email / ເບີໂທ</strong><strong>ປະເພດ</strong><strong>ວັນທີ</strong></div>{rows.map(x=><div key={x.id} style={rowStyle}><span>{x.name||'—'}</span><span>{x.email||'—'}<small style={{display:'block',color:'var(--ink-3)'}}>{x.phone||'—'}</small></span><span>{x.type}</span><span>{formatDateLao(x.created_at)}</span></div>)}</div></section>}
const rowStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1.2fr 1.5fr .8fr 1fr',gap:12,padding:'12px 18px',borderBottom:'1px solid var(--line-2)',fontSize:12,alignItems:'center'};
