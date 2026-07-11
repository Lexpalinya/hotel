create extension if not exists btree_gist;

alter type room_status add value if not exists 'inspection';

alter table public.users
  add column if not exists active boolean not null default true,
  add column if not exists identity_no text,
  add column if not exists address text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.rooms
  add column if not exists room_type_id uuid references public.room_types(id) on delete restrict,
  add column if not exists active boolean not null default true;

update public.rooms r set room_type_id = rt.id
from public.room_types rt where r.room_type_id is null and rt.name = r.type;

alter table public.bookings
  add column if not exists source text not null default 'customer',
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists created_by uuid references public.users(id) on delete set null;

alter table public.payments
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists verified_by uuid references public.users(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists note text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_reason text;

alter table public.booking_charges
  add column if not exists quantity numeric(10,2) not null default 1,
  add column if not exists unit_price int,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text;

update public.booking_charges set unit_price = amount where unit_price is null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists audit_staff_read on public.audit_logs;
create policy audit_staff_read on public.audit_logs for select using (public.is_staff());
grant select, insert on public.audit_logs to authenticated, service_role;

do $$ begin
  alter table public.bookings add constraint bookings_no_room_overlap
    exclude using gist (
      room_id with =,
      daterange(check_in, check_out, '[)') with &&
    ) where (status in ('pending', 'confirmed', 'checked_in'));
exception when duplicate_object then null; end $$;

create or replace function public.write_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_before jsonb default null, p_after jsonb default null
) returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after);
$$;

create or replace function public.staff_check_in(p_booking_id uuid)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; r public.rooms;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then raise exception 'booking_not_found'; end if;
  if b.status not in ('pending','confirmed') then raise exception 'invalid_booking_status'; end if;
  select * into r from public.rooms where id = b.room_id for update;
  if not r.active or r.status in ('occupied','out_of_order') then raise exception 'room_not_ready'; end if;
  update public.bookings set status='checked_in', checked_in_at=now() where id=b.id returning * into b;
  update public.rooms set status='occupied' where id=b.room_id;
  perform public.write_audit('check_in','booking',b.id,to_jsonb(b) || jsonb_build_object('status','confirmed'),to_jsonb(b));
  return b;
end $$;

create or replace function public.staff_check_out(p_booking_id uuid, p_allow_balance boolean default false)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings; total_due bigint; total_paid bigint;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if b.id is null then raise exception 'booking_not_found'; end if;
  if b.status <> 'checked_in' then raise exception 'invalid_booking_status'; end if;
  select b.total_amount + coalesce(sum(c.amount),0) into total_due
    from public.booking_charges c where c.booking_id=b.id and c.voided_at is null;
  select coalesce(sum(p.amount),0) into total_paid
    from public.payments p where p.booking_id=b.id and p.status='paid';
  if total_paid < total_due and not p_allow_balance then raise exception 'outstanding_balance'; end if;
  update public.bookings set status='checked_out', checked_out_at=now() where id=b.id returning * into b;
  update public.rooms set status='inspection' where id=b.room_id;
  perform public.write_audit('check_out','booking',b.id,null,to_jsonb(b));
  return b;
end $$;

grant execute on function public.staff_check_in(uuid) to authenticated, service_role;
grant execute on function public.staff_check_out(uuid, boolean) to authenticated, service_role;
grant execute on function public.write_audit(text,text,uuid,jsonb,jsonb) to authenticated, service_role;
