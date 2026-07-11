'use client';
import {useTransition} from 'react';import{useRouter}from'next/navigation';
export default function VerifyPaymentButton({id}:{id:string}){const router=useRouter();const[pending,start]=useTransition();return <button className="h-btn h-btn--accent" disabled={pending} onClick={()=>start(async()=>{if(!confirm('ຢືນຢັນວ່າໄດ້ຮັບເງິນແລ້ວ?'))return;const r=await fetch(`/api/staff/payments/${id}/verify`,{method:'POST'});if(!r.ok)alert((await r.json()).error||'Verify failed');router.refresh();})}>{pending?'...':'ຢືນຢັນການຊຳລະ'}</button>}
