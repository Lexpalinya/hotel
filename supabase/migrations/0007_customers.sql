create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  customer_type text,
  identity_no text,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_email_unique on public.customers(lower(email)) where email is not null;
create index if not exists idx_customers_name on public.customers(full_name);
create index if not exists idx_customers_phone on public.customers(phone);

insert into public.customers(auth_user_id,full_name,email,phone,customer_type,active,created_at)
select id,coalesce(nullif(full_name,''),email,'Customer'),email,phone,guest_type,active,created_at
from public.users where role='guest'
on conflict (auth_user_id) do update set
  full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,
  customer_type=excluded.customer_type,active=excluded.active;

alter table public.bookings add column if not exists customer_id uuid references public.customers(id) on delete restrict;
update public.bookings b set customer_id=c.id from public.customers c
where b.customer_id is null and c.auth_user_id=b.guest_id;
create index if not exists idx_bookings_customer on public.bookings(customer_id);

alter table public.customers enable row level security;
drop policy if exists customers_self_select on public.customers;
create policy customers_self_select on public.customers for select
  using (auth_user_id=auth.uid() or public.is_staff());
drop policy if exists customers_self_update on public.customers;
create policy customers_self_update on public.customers for update
  using (auth_user_id=auth.uid() or public.is_staff())
  with check (auth_user_id=auth.uid() or public.is_staff());
drop policy if exists customers_staff_insert on public.customers;
create policy customers_staff_insert on public.customers for insert with check (public.is_staff());

grant all on public.customers to postgres,authenticated,service_role;

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at before update on public.customers
for each row execute function public.set_updated_at();

create or replace function public.sync_customer_from_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.role='guest' then
    insert into public.customers(auth_user_id,full_name,email,phone,customer_type,active)
    values(new.id,coalesce(nullif(new.full_name,''),new.email,'Customer'),new.email,new.phone,new.guest_type,new.active)
    on conflict(auth_user_id) do update set
      full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,
      customer_type=excluded.customer_type,active=excluded.active;
  end if;
  return new;
end $$;
drop trigger if exists on_user_sync_customer on public.users;
create trigger on_user_sync_customer after insert or update on public.users
for each row execute function public.sync_customer_from_user();

create or replace function public.staff_create_booking(
  p_full_name text, p_email text, p_phone text, p_room_id uuid,
  p_check_in date, p_check_out date, p_guests int,
  p_mark_paid boolean default false, p_payment_method payment_method default 'cash'
) returns public.bookings language plpgsql security definer set search_path=public as $$
declare c public.customers; r public.rooms; b public.bookings; v_nights int; v_code text;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'customer_name_required'; end if;
  if p_check_out<=p_check_in or p_guests<1 then raise exception 'invalid_booking_details'; end if;
  select * into r from public.rooms where id=p_room_id and active=true for update;
  if r.id is null or r.status='out_of_order' then raise exception 'room_unavailable'; end if;
  if p_guests>r.capacity then raise exception 'capacity_exceeded'; end if;
  if nullif(lower(trim(p_email)),'') is not null then
    select * into c from public.customers where lower(email)=lower(trim(p_email)) limit 1;
  end if;
  if c.id is null then
    insert into public.customers(full_name,email,phone)
    values(trim(p_full_name),nullif(lower(trim(p_email)),''),nullif(trim(p_phone),'')) returning * into c;
  else
    update public.customers set full_name=trim(p_full_name),phone=coalesce(nullif(trim(p_phone),''),phone)
    where id=c.id returning * into c;
  end if;
  v_nights=p_check_out-p_check_in;
  v_code='BK-'||to_char(current_date,'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.bookings(code,customer_id,room_id,check_in,check_out,guests,status,total_amount,source,created_by)
  values(v_code,c.id,r.id,p_check_in,p_check_out,p_guests,case when p_mark_paid then 'confirmed'::booking_status else 'pending'::booking_status end,v_nights*r.price_per_night,'staff',auth.uid())
  returning * into b;
  if p_mark_paid then
    insert into public.payments(booking_id,amount,method,status,paid_at,ref,created_by,verified_by,verified_at)
    values(b.id,b.total_amount,p_payment_method,'paid',now(),'COUNTER-'||extract(epoch from now())::bigint,auth.uid(),auth.uid(),now());
  end if;
  perform public.write_audit('create','booking',b.id,null,to_jsonb(b));
  return b;
end $$;
grant execute on function public.staff_create_booking(text,text,text,uuid,date,date,int,boolean,payment_method) to authenticated,service_role;
