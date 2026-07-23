create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.users(id,email,full_name,phone,guest_type)
  values(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'customer_type','')
  ) on conflict(id) do nothing;
  return new;
end $$;

create or replace function public.sync_customer_from_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.role='guest' then
    insert into public.customers(auth_user_id,full_name,email,phone,customer_type,active)
    values(new.id,coalesce(nullif(new.full_name,''),new.email,'Customer'),new.email,new.phone,new.guest_type,new.active)
    on conflict(auth_user_id) do update set
      full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,
      customer_type=excluded.customer_type,active=excluded.active;
  else
    update public.customers set auth_user_id=null,active=false where auth_user_id=new.id;
  end if;
  return new;
end $$;

update public.customers c set auth_user_id=null,active=false
from public.users u where c.auth_user_id=u.id and u.role<>'guest';
