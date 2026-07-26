create or replace function public.staff_check_in(p_booking_id uuid)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; r public.rooms; total_paid bigint;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then raise exception 'booking_not_found'; end if;
  if b.status <> 'confirmed' then raise exception 'booking_must_be_confirmed'; end if;
  select coalesce(sum(p.amount),0) into total_paid
    from public.payments p where p.booking_id=b.id and p.status='paid';
  if total_paid < ceil(b.total_amount * 0.30) then raise exception 'deposit_required'; end if;
  select * into r from public.rooms where id = b.room_id for update;
  if not r.active or r.status in ('occupied','out_of_order') then raise exception 'room_not_ready'; end if;
  update public.bookings set status='checked_in', checked_in_at=now() where id=b.id returning * into b;
  update public.rooms set status='occupied' where id=b.room_id;
  perform public.write_audit('check_in','booking',b.id,to_jsonb(b) || jsonb_build_object('status','confirmed'),to_jsonb(b));
  return b;
end $$;
grant execute on function public.staff_check_in(uuid) to authenticated, service_role;
