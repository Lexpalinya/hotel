import {NextResponse} from 'next/server';
import {requireStaff} from '@/lib/auth';

export async function POST(request:Request){
  const a=await requireStaff();if(!a)return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const b=await request.json().catch(()=>null) as any;
  const number=String(b?.number||'').trim();
  if(!number||!b?.type||Number(b.capacity)<1||Number(b.pricePerNight)<0)return NextResponse.json({ok:false,error:'Invalid room data'},{status:400});
  const values={number,type:String(b.type).trim(),beds:b.beds||null,capacity:Number(b.capacity),price_per_night:Number(b.pricePerNight),floor_id:b.floorId||null,amenities:String(b.amenities||'').split(',').map((x:string)=>x.trim()).filter(Boolean),description:b.description||null,image_url:b.imageUrl||null,status:'available',active:true};
  const {data:existing}=await a.supabase.from('rooms').select('id,active').eq('number',number).maybeSingle();
  if(existing?.active)return NextResponse.json({ok:false,error:'Room number already exists'},{status:409});
  const result=existing
    ?await a.supabase.from('rooms').update(values).eq('id',existing.id).select('*').single()
    :await a.supabase.from('rooms').insert(values).select('*').single();
  if(result.error)return NextResponse.json({ok:false,error:result.error.message},{status:result.error.code==='23505'?409:500});
  return NextResponse.json({ok:true,data:result.data,error:null},{status:existing?200:201});
}
