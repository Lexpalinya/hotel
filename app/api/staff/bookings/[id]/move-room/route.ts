import {NextResponse} from 'next/server';
import {requireStaff} from '@/lib/auth';
export async function POST(request:Request,{params}:{params:{id:string}}){
  const a=await requireStaff();if(!a)return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const body=await request.json().catch(()=>null) as {roomId?:string}|null;if(!body?.roomId)return NextResponse.json({ok:false,error:'Room is required'},{status:400});
  const {data,error}=await a.supabase.rpc('staff_move_booking_room',{p_booking_id:params.id,p_room_id:body.roomId});
  if(error)return NextResponse.json({ok:false,error:error.message},{status:error.message.includes('conflict')||error.message.includes('unavailable')?409:422});
  return NextResponse.json({ok:true,data,error:null});
}
