import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from('bookings').select('id, room_id').eq('id', params.id).single();
  if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await supabase
    .from('bookings')
    .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
    .eq('id', booking.id);

  if (booking.room_id) {
    await supabase.from('rooms').update({ status: 'dirty' }).eq('id', booking.room_id);
  }
  return NextResponse.redirect(new URL('/app/history', req.url));
}
