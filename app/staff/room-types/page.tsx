import { createClient } from '@/lib/supabase-server';
import { WTopBar } from '@/components/staff-bits';
import RoomTypeManager from './room-type-manager';

export const dynamic = 'force-dynamic';

export default async function RoomTypesPage() {
  const supabase = createClient();
  const { data } = await supabase.from('room_types').select('*').order('name');
  return <><WTopBar title="ຈັດການປະເພດຫ້ອງ" sub={`${data?.length ?? 0} ປະເພດ`} /><RoomTypeManager initial={data ?? []} /></>;
}
