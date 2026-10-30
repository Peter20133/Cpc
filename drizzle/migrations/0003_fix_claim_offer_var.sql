
create or replace function public.claim_offer(_offer_id uuid) returns public.coupons
language plpgsql security definer set search_path = public as $$
declare o public.offers; uid uuid := auth.uid(); n int; c public.coupons; v_code text; today date := (now() at time zone 'Europe/Bucharest')::date;
begin
  if uid is null then raise exception 'Trebuie să fii autentificat pentru a revendica oferta.'; end if;
  select * into o from public.offers where id = _offer_id for update;
  if o is null or o.status <> 'active' then raise exception 'Oferta nu este activă.'; end if;
  if not exists (select 1 from public.restaurants where id=o.restaurant_id and status='approved') then raise exception 'Restaurantul nu este activ.'; end if;
  if not public.plan_allows_offers(o.restaurant_id) then raise exception 'Oferta nu mai este disponibilă.'; end if;
  if today < o.starts_on then raise exception 'Oferta începe pe %.', o.starts_on; end if;
  if today > o.ends_on then raise exception 'Oferta a expirat.'; end if;
  select count(*) into n from public.coupons cc where cc.offer_id=o.id and cc.user_id=uid and (cc.status='used' or (cc.status='claimed' and cc.expires_at>now()));
  if n >= o.max_uses_per_user then raise exception 'Ai atins numărul maxim de utilizări pentru această ofertă.'; end if;
  if o.max_uses is not null then
    select count(*) into n from public.coupons cc where cc.offer_id=o.id and (cc.status='used' or (cc.status='claimed' and cc.expires_at>now()));
    if n >= o.max_uses then raise exception 'Oferta a fost epuizată.'; end if;
  end if;
  loop
    v_code := 'RM-' || upper(substr(md5(gen_random_uuid()::text),1,4)) || '-' || upper(substr(md5(gen_random_uuid()::text),1,4)) || '-' || upper(substr(md5(gen_random_uuid()::text),1,4));
    exit when not exists (select 1 from public.coupons cc where cc.code = v_code);
  end loop;
  insert into public.coupons (code, offer_id, restaurant_id, user_id, expires_at)
  values (v_code, o.id, o.restaurant_id, uid, ((o.ends_on + 1)::timestamp at time zone 'Europe/Bucharest'))
  returning * into c;
  perform set_config('rm.internal','1',true);
  update public.offers set claims_count = claims_count + 1 where id = o.id;
  perform set_config('rm.internal','0',true);
  return c;
end $$;
revoke execute on function public.claim_offer(uuid) from anon;
