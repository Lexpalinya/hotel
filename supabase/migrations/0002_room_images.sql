-- ================================================================
-- 0002 — Room images: column + storage bucket + policies
-- ================================================================

-- 1. Add image_url to rooms
alter table public.rooms add column if not exists image_url text;

-- 2. Create public storage bucket for room images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-images',
  'room-images',
  true,
  5242880,                                    -- 5MB max
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. RLS policies on storage.objects for room-images bucket
-- Drop existing first (idempotent)
drop policy if exists "room_images_public_read" on storage.objects;
drop policy if exists "room_images_staff_insert" on storage.objects;
drop policy if exists "room_images_staff_update" on storage.objects;
drop policy if exists "room_images_staff_delete" on storage.objects;

-- Anyone (including unauthenticated) can read — bucket is public anyway,
-- but explicit RLS makes intent clear.
create policy "room_images_public_read" on storage.objects
  for select using (bucket_id = 'room-images');

-- Only staff/admin can write
create policy "room_images_staff_insert" on storage.objects
  for insert with check (bucket_id = 'room-images' and public.is_staff());

create policy "room_images_staff_update" on storage.objects
  for update using (bucket_id = 'room-images' and public.is_staff());

create policy "room_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'room-images' and public.is_staff());
