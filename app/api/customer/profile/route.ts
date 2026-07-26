import {NextResponse} from 'next/server';
import {getRequestActor} from '@/lib/auth';
export async function PATCH(request:Request){
  const a=await getRequestActor();if(!a||a.profile.role!=='guest')return NextResponse.json({ok:false,error:'Forbidden'},{status:403});
  const b=await request.json().catch(()=>null) as any;
  if(!b?.fullName?.trim()||!b?.phone?.trim())return NextResponse.json({ok:false,error:'Name and phone are required'},{status:400});
  const profile={full_name:b.fullName.trim(),phone:b.phone.trim(),guest_type:b.customerType||'visitor'};
  const customer={full_name:b.fullName.trim(),phone:b.phone.trim(),customer_type:b.customerType||'visitor',identity_no:b.identityNo?.trim()||null,address:b.address?.trim()||null};
  const {error:userError}=await a.supabase.from('users').update(profile).eq('id',a.user.id);if(userError)return NextResponse.json({ok:false,error:userError.message},{status:500});
  const {data,error}=await a.supabase.from('customers').update(customer).eq('auth_user_id',a.user.id).select('*').single();if(error)return NextResponse.json({ok:false,error:error.message},{status:500});
  return NextResponse.json({ok:true,data,error:null});
}
