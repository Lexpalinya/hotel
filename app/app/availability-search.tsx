'use client';
import { useState } from 'react';
import Link from 'next/link';
import { formatKip } from '@/lib/format';
import type { Room } from '@/lib/types';

export default function AvailabilitySearch({ initialRooms }: { initialRooms: Room[] }) {
  const today = new Date(); const tomorrow = new Date(today.getTime()+86400000);
  const [checkIn,setCheckIn] = useState(today.toISOString().slice(0,10));
  const [checkOut,setCheckOut] = useState(tomorrow.toISOString().slice(0,10));
  const [guests,setGuests] = useState(1); const [rooms,setRooms] = useState(initialRooms);
  const [loading,setLoading] = useState(false); const [error,setError] = useState('');
  const search = async (e:React.FormEvent) => { e.preventDefault(); setError(''); setLoading(true); try { const q=new URLSearchParams({check_in:checkIn,check_out:checkOut,guests:String(guests)}); const r=await fetch(`/api/availability?${q}`,{cache:'no-store'}); const result=await r.json(); if(!r.ok) throw new Error(result.error); setRooms(result.data??[]); } catch(e){setError(e instanceof Error?e.message:String(e));} finally{setLoading(false);} };
  return <section>
    <form onSubmit={search} className="h-card" style={{ padding:14, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:18 }}>
      <label style={{display:'grid',gap:4,fontSize:10,color:'var(--ink-3)'}}>ເຂົ້າພັກ<input type="date" min={today.toISOString().slice(0,10)} value={checkIn} onChange={e=>{setCheckIn(e.target.value);if(checkOut<=e.target.value)setCheckOut(new Date(new Date(e.target.value).getTime()+86400000).toISOString().slice(0,10));}} required /></label>
      <label style={{display:'grid',gap:4,fontSize:10,color:'var(--ink-3)'}}>ອອກ<input type="date" min={new Date(new Date(checkIn).getTime()+86400000).toISOString().slice(0,10)} value={checkOut} onChange={e=>setCheckOut(e.target.value)} required /></label>
      <label style={{display:'grid',gap:4,fontSize:10,color:'var(--ink-3)'}}>ຈຳນວນຄົນ<input type="number" min={1} max={20} value={guests} onChange={e=>setGuests(Math.max(1,Number(e.target.value)))} /></label>
      <button className="h-btn h-btn--primary" disabled={loading} style={{alignSelf:'end',height:40}}>{loading?'...':'ກວດສອບຫ້ອງພັກ'}</button>
    </form>
    {error && <div style={{padding:12,color:'var(--danger)',background:'var(--danger-soft)',marginBottom:14,borderRadius:6}}>{error}</div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}><h2 className="h-serif" style={{fontSize:22,margin:0}}>ຫ້ອງວ່າງ</h2><span className="h-mono" style={{fontSize:11,color:'var(--ink-3)'}}>{rooms.length} ຫ້ອງ</span></div>
    {!rooms.length ? <div className="h-card" style={{padding:40,textAlign:'center',color:'var(--ink-3)'}}>ບໍ່ມີຫ້ອງວ່າງໃນຊ່ວງວັນທີ່ເລືອກ</div> : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))',gap:14}}>{rooms.map(r=><Link key={r.id} href={`/app/room/${r.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`} className="h-card-hover" style={{background:'var(--paper)',borderRadius:8,overflow:'hidden',border:'1px solid var(--line)',color:'inherit'}}><div style={{aspectRatio:'4/3',background:'var(--paper-2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{r.image_url?<img src={r.image_url} alt={`ຫ້ອງ ${r.number}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span className="h-mono">ROOM {r.number}</span>}</div><div style={{padding:14}}><div style={{display:'flex',justifyContent:'space-between'}}><div><strong className="h-mono">{r.number}</strong><div style={{fontSize:12,color:'var(--ink-2)'}}>{r.type}</div></div><strong className="h-mono">{formatKip(r.price_per_night)}</strong></div><div style={{fontSize:11,color:'var(--ink-3)',marginTop:8}}>{r.capacity} ຄົນ · {r.beds||'—'}</div></div></Link>)}</div>}
  </section>;
}
