'use client';
import {useTransition} from 'react';
import {useRouter} from 'next/navigation';
export default function CancelBookingButton({id}:{id:string}){const router=useRouter(),[pending,start]=useTransition();return <button className="h-btn" disabled={pending} onClick={()=>{if(!confirm('ຕ້ອງການຍົກເລີກການຈອງນີ້?'))return;start(async()=>{const r=await fetch(`/api/bookings/${id}/cancel`,{method:'POST'}),j=await r.json();if(!r.ok)return alert(j.error||'Cancel failed');router.refresh()})}}>{pending?'...':'ຍົກເລີກ'}</button>}
