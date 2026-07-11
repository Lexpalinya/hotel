create unique index if not exists payments_one_pending_per_booking
  on public.payments(booking_id) where status='pending';

create or replace function public.staff_move_booking_room(p_booking_id uuid, p_room_id uuid)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare b public.bookings; old_room public.rooms; new_room public.rooms;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into b from public.bookings where id=p_booking_id for update;
  if b.id is null then raise exception 'booking_not_found'; end if;
  if b.status not in ('pending','confirmed','checked_in') then raise exception 'booking_cannot_move'; end if;
  if b.room_id=p_room_id then return b; end if;
  select * into new_room from public.rooms where id=p_room_id and active=true for update;
  if new_room.id is null or new_room.status in ('occupied','out_of_order') then raise exception 'room_unavailable'; end if;
  if b.guests>new_room.capacity then raise exception 'capacity_exceeded'; end if;
  select * into old_room from public.rooms where id=b.room_id for update;
  update public.bookings set room_id=p_room_id where id=b.id returning * into b;
  if b.status='checked_in' then
    update public.rooms set status='available' where id=old_room.id;
    update public.rooms set status='occupied' where id=new_room.id;
  end if;
  perform public.write_audit('move_room','booking',b.id,jsonb_build_object('room_id',old_room.id),jsonb_build_object('room_id',new_room.id));
  return b;
exception when exclusion_violation then raise exception 'room_date_conflict';
end $$;
grant execute on function public.staff_move_booking_room(uuid,uuid) to authenticated,service_role;
