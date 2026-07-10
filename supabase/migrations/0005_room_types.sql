create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  beds text,
  capacity int not null default 1 check (capacity > 0),
  base_price int not null default 0 check (base_price >= 0),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.room_types (name, beds, capacity, base_price)
select type, max(beds), max(capacity), max(price_per_night)
from public.rooms group by type
on conflict (name) do nothing;

alter table public.room_types enable row level security;
drop policy if exists room_types_public_read on public.room_types;
create policy room_types_public_read on public.room_types for select using (true);
drop policy if exists room_types_staff_write on public.room_types;
create policy room_types_staff_write on public.room_types for all
  using (public.is_staff()) with check (public.is_staff());

grant all on public.room_types to postgres, anon, authenticated, service_role;
