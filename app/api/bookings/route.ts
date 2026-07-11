import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { bookingCode, nightsBetween } from '@/lib/format';

type CreateBookingBody = { roomId?: string; checkIn?: string; checkOut?: string; guests?: number };

export async function POST(request: Request) {
  const actor = await getRequestActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  let body: CreateBookingBody;
  try { body = await request.json() as CreateBookingBody; }
  catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const guests = Number(body.guests || 0);
  if (!body.roomId || !body.checkIn || !body.checkOut || body.checkOut <= body.checkIn || guests < 1) {
    return NextResponse.json({ ok: false, error: 'Invalid booking details.' }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (body.checkIn < today) return NextResponse.json({ ok: false, error: 'Check-in cannot be in the past.' }, { status: 400 });
  const { data: room } = await actor.supabase.from('rooms').select('*').eq('id', body.roomId).eq('active', true).single();
  if (!room || room.status === 'out_of_order') return NextResponse.json({ ok: false, error: 'Room is unavailable.' }, { status: 404 });
  if (guests > room.capacity) return NextResponse.json({ ok: false, error: `Room capacity is ${room.capacity}.` }, { status: 400 });
  const nights = nightsBetween(body.checkIn, body.checkOut);
  if (nights < 1) return NextResponse.json({ ok: false, error: 'Stay must be at least one night.' }, { status: 400 });
  const { data: conflict } = await actor.supabase.from('bookings').select('id').eq('room_id', room.id)
    .in('status', ['pending', 'confirmed', 'checked_in']).lt('check_in', body.checkOut).gt('check_out', body.checkIn).limit(1);
  if (conflict?.length) return NextResponse.json({ ok: false, error: 'Room is no longer available.' }, { status: 409 });
  const { data: customer } = await actor.supabase.from('customers').select('id').eq('auth_user_id', actor.user.id).single();
  const { data, error } = await actor.supabase.from('bookings').insert({
    code: bookingCode(), guest_id: actor.user.id, customer_id: customer?.id ?? null, room_id: room.id,
    check_in: body.checkIn, check_out: body.checkOut, guests,
    status: 'pending', total_amount: nights * room.price_per_night,
    source: actor.profile.role === 'guest' ? 'customer' : 'staff', created_by: actor.user.id,
  }).select('id,code,status,total_amount').single();
  if (error) {
    const conflictError = error.code === '23P01' || error.message.includes('bookings_no_room_overlap');
    return NextResponse.json({ ok: false, error: conflictError ? 'Room is no longer available.' : error.message }, { status: conflictError ? 409 : 500 });
  }
  await actor.supabase.rpc('write_audit', { p_action: 'create', p_entity_type: 'booking', p_entity_id: data.id, p_after: data });
  return NextResponse.json({ ok: true, data, error: null }, { status: 201 });
}
