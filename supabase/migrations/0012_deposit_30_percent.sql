create or replace function public.staff_create_booking(
  p_full_name text, p_email text, p_phone text, p_room_id uuid,
  p_check_in date, p_check_out date, p_guests int,
  p_mark_paid boolean default false, p_payment_method payment_method default 'cash'
) returns public.bookings language plpgsql security definer set search_path=public as $$
declare c public.customers; r public.rooms; b public.bookings; v_nights int; v_code text; v_deposit int;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'customer_name_required'; end if;
  if p_check_out<=p_check_in or p_guests<1 then raise exception 'invalid_booking_details'; end if;
  select * into r from public.rooms where id=p_room_id and active=true for update;
  if r.id is null or r.status='out_of_order' then raise exception 'room_unavailable'; end if;
  if p_guests>r.capacity then raise exception 'capacity_exceeded'; end if;
  if nullif(lower(trim(p_email)),'') is not null then select * into c from public.customers where lower(email)=lower(trim(p_email)) limit 1; end if;
  if c.id is null then insert into public.customers(full_name,email,phone) values(trim(p_full_name),nullif(lower(trim(p_email)),''),nullif(trim(p_phone),'')) returning * into c;
  else update public.customers set full_name=trim(p_full_name),phone=coalesce(nullif(trim(p_phone),''),phone) where id=c.id returning * into c; end if;
  v_nights=p_check_out-p_check_in;v_code='BK-'||to_char(current_date,'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.bookings(code,customer_id,room_id,check_in,check_out,guests,status,total_amount,source,created_by)
  values(v_code,c.id,r.id,p_check_in,p_check_out,p_guests,case when p_mark_paid then 'confirmed'::booking_status else 'pending'::booking_status end,v_nights*r.price_per_night,'staff',auth.uid()) returning * into b;
  if p_mark_paid then
    v_deposit=ceil(b.total_amount*0.30);
    insert into public.payments(booking_id,amount,method,status,paid_at,ref,created_by,verified_by,verified_at)
    values(b.id,v_deposit,p_payment_method,'paid',now(),'DEPOSIT-'||extract(epoch from now())::bigint,auth.uid(),auth.uid(),now());
  end if;
  perform public.write_audit('create','booking',b.id,null,to_jsonb(b));return b;
end $$;
grant execute on function public.staff_create_booking(text,text,text,uuid,date,date,int,boolean,payment_method) to authenticated,service_role;
