'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Modal,Field} from '@/components/modal';
export default function MoveRoomButton({bookingId,checkIn,checkOut,guests}:{bookingId:string;checkIn:string;checkOut:string;guests:number}){
  const router=useRouter(),[open,setOpen]=useState(false),[pending,start]=useTransition(),[rooms,setRooms]=useState<any[]>([]),[roomId,setRoomId]=useState(''),[err,setErr]=useState('');
  const show=()=>start(async()=>{setErr('');const q=new URLSearchParams({check_in:checkIn,check_out:checkOut,guests:String(guests)}),r=await fetch(`/api/availability?${q}`),j=await r.json();if(!r.ok)return setErr(j.error||'Load rooms failed');setRooms(j.data||[]);setRoomId(j.data?.[0]?.id||'');setOpen(true)});
  const submit=()=>start(async()=>{const r=await fetch(`/api/staff/bookings/${bookingId}/move-room`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId})}),j=await r.json();if(!r.ok)return setErr(j.error||'Move room failed');setOpen(false);router.refresh()});
  return <><button className="h-btn" disabled={pending} onClick={show}>ຍ້າຍຫ້ອງ</button>{err&&!open&&<span style={{color:'var(--danger)',fontSize:12}}>{err}</span>}<Modal open={open} onClose={()=>setOpen(false)} title="ຍ້າຍຫ້ອງ" sub={`${checkIn} - ${checkOut}`} footer={<><button className="h-btn" onClick={()=>setOpen(false)}>ຍົກເລີກ</button><button className="h-btn h-btn--accent" disabled={pending||!roomId} onClick={submit}>ຢືນຢັນ</button></>}><Field label="ຫ້ອງວ່າງ"><select value={roomId} onChange={e=>setRoomId(e.target.value)}>{rooms.map(r=><option key={r.id} value={r.id}>ຫ້ອງ {r.number} · {r.type} · {r.capacity} ຄົນ</option>)}</select></Field>{!rooms.length&&<div style={{color:'var(--warn)',fontSize:12}}>ບໍ່ມີຫ້ອງວ່າງ</div>}{err&&<div style={{color:'var(--danger)',fontSize:12}}>{err}</div>}</Modal></>;
}
