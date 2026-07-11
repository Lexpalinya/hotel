import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';

export async function GET(request: Request) {
  const actor = await getRequestActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const checkIn = url.searchParams.get('check_in');
  const checkOut = url.searchParams.get('check_out');
  const guests = Number(url.searchParams.get('guests') || 1);
  if (!checkIn || !checkOut || checkOut <= checkIn || guests < 1) {
    return NextResponse.json({ ok: false, error: 'Invalid dates or guest count.' }, { status: 400 });
  }
  const { data: conflicts, error: conflictError } = await actor.supabase
    .from('bookings').select('room_id')
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .lt('check_in', checkOut).gt('check_out', checkIn);
  if (conflictError) return NextResponse.json({ ok: false, error: conflictError.message }, { status: 500 });
  const blocked = (conflicts ?? []).map(row => row.room_id);
  let query = actor.supabase.from('rooms').select('*')
    .eq('active', true).eq('status', 'available').gte('capacity', guests).order('price_per_night');
  if (blocked.length) query = query.not('id', 'in', `(${blocked.join(',')})`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data, error: null });
}

