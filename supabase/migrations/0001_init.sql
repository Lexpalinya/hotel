-- ================================================================
-- University Hotel — MVP schema
-- Run in Supabase SQL Editor (paste this whole file). Idempotent.
-- ================================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('guest','staff','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type room_status as enum ('available','reserved','occupied','dirty','cleaning','out_of_order');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','checked_in','checked_out','cancelled','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','paid','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('promptpay','cash','card','transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('open','in_progress','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_kind as enum ('cleaning','maintenance','inspection');
exception when duplicate_object then null; end $$;

-- ─── 1. USERS ────────────────────────────────────────────────
-- Mirrors auth.users; created via trigger when someone signs up.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  phone text,
  full_name text not null default '',
  role user_role not null default 'guest',
  guest_type text,  -- 'faculty', 'parent', 'alumni', 'visitor', etc.
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);

-- Auto-create users row on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ─── 2. FLOORS ───────────────────────────────────────────────
create table if not exists public.floors (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  name text not null,
  purposes text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── 3. ROOMS ────────────────────────────────────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  type text not null,                  -- 'Standard', 'Deluxe', 'Suite'
  beds text,                           -- 'King', 'Twin', 'Single'
  capacity int not null default 1,
  price_per_night int not null,        -- in smallest currency unit (LAK kip — whole units OK)
  floor_id uuid references public.floors(id) on delete set null,
  status room_status not null default 'available',
  amenities text[] not null default '{}',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_rooms_floor on public.rooms(floor_id);

-- ─── 4. BOOKINGS ─────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- 'BK-2026-0142'
  guest_id uuid references public.users(id) on delete set null,
  room_id uuid not null references public.rooms(id),
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  status booking_status not null default 'pending',
  total_amount int not null,
  notes text,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dates_ok check (check_out > check_in)
);

create index if not exists idx_bookings_guest on public.bookings(guest_id);
create index if not exists idx_bookings_room on public.bookings(room_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_dates on public.bookings(check_in, check_out);

-- ─── 5. PAYMENTS ─────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount int not null,
  method payment_method not null default 'promptpay',
  status payment_status not null default 'pending',
  ref text,                            -- external txn ref
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_booking on public.payments(booking_id);

-- ─── 6. BOOKING CHARGES (extras: minibar, laundry, etc.) ──────
create table if not exists public.booking_charges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  label text not null,
  amount int not null,
  added_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_charges_booking on public.booking_charges(booking_id);

-- ─── 7. ITEMS (inventory) ────────────────────────────────────
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null,              -- 'minibar', 'amenity', 'linen', 'cleaning', 'fnb'
  stock int not null default 0,
  threshold int not null default 0,    -- alert when stock <= threshold
  unit text not null default 'pcs',
  price int,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_category on public.items(category);

-- ─── 8. STOCK MOVEMENTS ──────────────────────────────────────
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  delta int not null,                  -- +5 (restock), -2 (used)
  reason text not null,
  ref_booking_id uuid references public.bookings(id),
  by_user uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_item on public.stock_movements(item_id);

-- ─── 9. TASKS (housekeeping) ─────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  kind task_kind not null default 'cleaning',
  priority text not null default 'normal',
  status task_status not null default 'open',
  assigned_to uuid references public.users(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_room on public.tasks(room_id);

-- ─── updated_at triggers ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists trg_rooms_updated_at on public.rooms;
  create trigger trg_rooms_updated_at before update on public.rooms
    for each row execute function public.set_updated_at();
  drop trigger if exists trg_bookings_updated_at on public.bookings;
  create trigger trg_bookings_updated_at before update on public.bookings
    for each row execute function public.set_updated_at();
  drop trigger if exists trg_tasks_updated_at on public.tasks;
  create trigger trg_tasks_updated_at before update on public.tasks
    for each row execute function public.set_updated_at();
end $$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.users           enable row level security;
alter table public.floors          enable row level security;
alter table public.rooms           enable row level security;
alter table public.bookings        enable row level security;
alter table public.payments        enable row level security;
alter table public.booking_charges enable row level security;
alter table public.items           enable row level security;
alter table public.stock_movements enable row level security;
alter table public.tasks           enable row level security;

-- helper: is current auth user staff/admin?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('staff','admin')
  );
$$;

-- USERS: user reads own row; staff reads all
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users for select
  using (auth.uid() = id or public.is_staff());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists users_staff_all on public.users;
create policy users_staff_all on public.users for all
  using (public.is_staff()) with check (public.is_staff());

-- ROOMS, FLOORS: public read, staff write
drop policy if exists rooms_public_read on public.rooms;
create policy rooms_public_read on public.rooms for select using (true);
drop policy if exists rooms_staff_write on public.rooms;
create policy rooms_staff_write on public.rooms for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists floors_public_read on public.floors;
create policy floors_public_read on public.floors for select using (true);
drop policy if exists floors_staff_write on public.floors;
create policy floors_staff_write on public.floors for all
  using (public.is_staff()) with check (public.is_staff());

-- BOOKINGS: guests see only their own; staff see all
drop policy if exists bookings_guest_select on public.bookings;
create policy bookings_guest_select on public.bookings for select
  using (guest_id = auth.uid() or public.is_staff());

drop policy if exists bookings_guest_insert on public.bookings;
create policy bookings_guest_insert on public.bookings for insert
  with check (guest_id = auth.uid() or public.is_staff());

drop policy if exists bookings_staff_all on public.bookings;
create policy bookings_staff_all on public.bookings for all
  using (public.is_staff()) with check (public.is_staff());

-- PAYMENTS: same as bookings (via booking)
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (
    public.is_staff() or
    exists (select 1 from public.bookings b where b.id = booking_id and b.guest_id = auth.uid())
  );
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert
  with check (
    public.is_staff() or
    exists (select 1 from public.bookings b where b.id = booking_id and b.guest_id = auth.uid())
  );
drop policy if exists payments_staff_update on public.payments;
create policy payments_staff_update on public.payments for update
  using (public.is_staff()) with check (public.is_staff());

-- CHARGES: staff write, guest read own
drop policy if exists charges_select on public.booking_charges;
create policy charges_select on public.booking_charges for select
  using (
    public.is_staff() or
    exists (select 1 from public.bookings b where b.id = booking_id and b.guest_id = auth.uid())
  );
drop policy if exists charges_staff_write on public.booking_charges;
create policy charges_staff_write on public.booking_charges for all
  using (public.is_staff()) with check (public.is_staff());

-- ITEMS, STOCK, TASKS: staff only
drop policy if exists items_staff_all on public.items;
create policy items_staff_all on public.items for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists stock_staff_all on public.stock_movements;
create policy stock_staff_all on public.stock_movements for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists tasks_staff_all on public.tasks;
create policy tasks_staff_all on public.tasks for all
  using (public.is_staff()) with check (public.is_staff());

-- ─── SEED DATA (5 floors, sample rooms, items) ────────────────
insert into public.floors (number, name, purposes) values
  (1, 'F1', '{"Lobby","Reception"}'),
  (2, 'F2', '{"Standard"}'),
  (3, 'F3', '{"Mixed"}'),
  (4, 'F4', '{"Deluxe"}'),
  (5, 'F5', '{"Suite","Premium"}')
on conflict (number) do nothing;

-- Sample rooms (only insert if rooms table is empty)
do $$
declare f1 uuid; f2 uuid; f3 uuid; f4 uuid; f5 uuid;
begin
  if (select count(*) from public.rooms) = 0 then
    select id into f1 from public.floors where number = 1;
    select id into f2 from public.floors where number = 2;
    select id into f3 from public.floors where number = 3;
    select id into f4 from public.floors where number = 4;
    select id into f5 from public.floors where number = 5;

    insert into public.rooms (number, type, beds, capacity, price_per_night, floor_id, amenities) values
      ('215', 'Standard',    'Single', 1, 1200, f2, '{"WiFi","AC"}'),
      ('301', 'Deluxe Twin', 'Twin',   2, 1800, f3, '{"WiFi","AC","Desk"}'),
      ('305', 'Deluxe',      'King',   2, 1600, f3, '{"WiFi","AC"}'),
      ('402', 'Deluxe',      'King',   2, 1600, f4, '{"WiFi","AC","Desk","Balcony"}'),
      ('412', 'Deluxe',      'King',   2, 1600, f4, '{"WiFi","AC","Desk","Balcony"}'),
      ('503', 'Suite',       'King',   3, 2800, f5, '{"WiFi","AC","Desk","Living"}'),
      ('510', 'Suite',       'King',   3, 2800, f5, '{"WiFi","AC","Desk","Living"}');
  end if;
end $$;

-- Sample items
insert into public.items (sku, name, category, stock, threshold, unit, price) values
  ('MB-001', 'Coke 330ml',      'minibar',  48,  12, 'can',     25),
  ('MB-002', 'Water 600ml',     'minibar', 120,  30, 'bottle',  15),
  ('MB-003', 'Snickers',        'minibar',  60,  20, 'bar',     30),
  ('AM-001', 'Bath towel',      'linen',   180,  40, 'pcs',    NULL),
  ('AM-002', 'Toothbrush kit',  'amenity', 240,  60, 'kit',    NULL),
  ('CL-001', 'Detergent 5L',    'cleaning', 14,   4, 'bottle', NULL)
on conflict (sku) do nothing;
