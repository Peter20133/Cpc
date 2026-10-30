
-- ===== Settings & catalogs =====
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  commission_amount numeric not null default 3,
  commission_currency text not null default 'RON',
  commission_on_no_show boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "Anyone reads settings" on public.app_settings for select using (true);
create policy "Admins update settings" on public.app_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.app_settings (id) values (1);

create table public.subscription_plans (
  code text primary key,
  name text not null,
  price numeric not null default 0,
  currency text not null default 'EUR',
  sort int not null default 0,
  features text[] not null default '{}',
  priority_ranking boolean not null default false,
  can_publish_offers boolean not null default false,
  has_stats boolean not null default false,
  has_badge boolean not null default false,
  homepage_feature boolean not null default false,
  detailed_reports boolean not null default false,
  priority_support boolean not null default false,
  active boolean not null default true
);
grant select on public.subscription_plans to anon, authenticated;
grant insert, update, delete on public.subscription_plans to authenticated;
grant all on public.subscription_plans to service_role;
alter table public.subscription_plans enable row level security;
create policy "Anyone reads plans" on public.subscription_plans for select using (true);
create policy "Admins manage plans" on public.subscription_plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.subscription_plans (code,name,price,currency,sort,features,priority_ranking,can_publish_offers,has_stats,has_badge,homepage_feature,detailed_reports,priority_support) values
('free','FREE',0,'EUR',0,array['Profil complet al restaurantului','Fotografii, meniu și program','Date de contact','Apariție în rezultatele căutării','Administrarea informațiilor'],false,false,false,false,false,false,false),
('pro','PRO',29,'EUR',1,array['Tot ce include FREE','Poziționare prioritară în rezultate','Publicarea ofertelor și reducerilor','Statistici vizualizări și rezervări','Badge „Restaurant Premium”'],true,true,true,true,false,false,false),
('premium','PREMIUM',59,'EUR',2,array['Tot ce include PRO','Campanii de promovare dedicate','Rapoarte detaliate','Promovare în secțiunea principală','Suport prioritar'],true,true,true,true,true,true,true);

create table public.campaign_packages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('search_top','homepage','offer','category_city')),
  name text not null,
  days int not null check (days > 0),
  price numeric not null check (price >= 0),
  currency text not null default 'EUR',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.campaign_packages to anon, authenticated;
grant insert, update, delete on public.campaign_packages to authenticated;
grant all on public.campaign_packages to service_role;
alter table public.campaign_packages enable row level security;
create policy "Anyone reads packages" on public.campaign_packages for select using (true);
create policy "Admins manage packages" on public.campaign_packages for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.campaign_packages (type,name,days,price) values
('search_top','Sus în căutări',7,15),('search_top','Sus în căutări',14,25),('search_top','Sus în căutări',30,45),
('homepage','Recomandat pe pagina principală',7,25),('homepage','Recomandat pe pagina principală',14,45),('homepage','Recomandat pe pagina principală',30,79),
('offer','Ofertă promovată',7,10),('offer','Ofertă promovată',14,18),('offer','Ofertă promovată',30,32),
('category_city','Evidențiat în categorie / oraș',7,12),('category_city','Evidențiat în categorie / oraș',14,22),('category_city','Evidențiat în categorie / oraș',30,39);

-- ===== Ownership =====
create table public.restaurant_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  contact_name text,
  phone text,
  message text,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);
grant select, insert, update on public.restaurant_owners to authenticated;
grant all on public.restaurant_owners to service_role;
alter table public.restaurant_owners enable row level security;
create policy "Users request ownership" on public.restaurant_owners for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "Users see own claims" on public.restaurant_owners for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Admins review claims" on public.restaurant_owners for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.is_owner(_uid uuid, _rid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurant_owners where user_id=_uid and restaurant_id=_rid and status='approved')
$$;

-- ===== Subscriptions, payments, campaigns =====
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  plan_code text not null references public.subscription_plans(code),
  status text not null default 'pending_payment' check (status in ('pending_payment','active','canceled','expired','past_due')),
  price numeric not null default 0,
  currency text not null default 'EUR',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_ref text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  package_id uuid references public.campaign_packages(id),
  type text not null,
  days int not null,
  price numeric not null,
  currency text not null default 'EUR',
  target_city text,
  target_cuisine text,
  offer_id uuid,
  status text not null default 'pending_payment' check (status in ('pending_payment','active','canceled','suspended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  kind text not null check (kind in ('subscription','campaign')),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  amount numeric not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending','paid','failed','canceled')),
  provider text,
  provider_ref text,
  description text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.subscriptions, public.campaigns, public.payments to authenticated;
grant all on public.subscriptions, public.campaigns, public.payments to service_role;
alter table public.subscriptions enable row level security;
alter table public.campaigns enable row level security;
alter table public.payments enable row level security;
create policy "Owner or admin read subs" on public.subscriptions for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));
create policy "Owner or admin read campaigns" on public.campaigns for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));
create policy "Owner or admin read payments" on public.payments for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));
create unique index payments_provider_ref_uq on public.payments(provider, provider_ref) where provider_ref is not null;

create or replace function public.restaurant_plan(_rid bigint) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select plan_code from public.subscriptions where restaurant_id=_rid and status='active' and current_period_end > now() order by current_period_end desc limit 1), 'free')
$$;

create or replace function public.plan_allows_offers(_rid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select can_publish_offers from public.subscription_plans where code = public.restaurant_plan(_rid)), false)
$$;

-- ===== Offers & coupons =====
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  title text not null check (length(title) between 3 and 120),
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric not null check (discount_value > 0),
  currency text not null default 'RON',
  starts_on date not null default current_date,
  ends_on date not null,
  valid_days smallint[] not null default '{1,2,3,4,5,6,7}',
  time_from time,
  time_to time,
  max_uses int check (max_uses is null or max_uses > 0),
  max_uses_per_user int not null default 1 check (max_uses_per_user > 0),
  min_bill numeric,
  min_people int,
  included_items text,
  excluded_items text,
  requires_reservation boolean not null default false,
  combinable boolean not null default false,
  exclusive boolean not null default false,
  terms text,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  claims_count int not null default 0,
  uses_count int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (discount_type <> 'percent' or discount_value <= 100)
);
grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "Public reads active offers" on public.offers for select using (status='active' and ends_on >= current_date and exists (select 1 from public.restaurants r where r.id=restaurant_id and r.status='approved'));
create policy "Owner/admin read offers" on public.offers for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));
create policy "Owner creates offers" on public.offers for insert to authenticated with check (public.is_owner(auth.uid(),restaurant_id) and public.plan_allows_offers(restaurant_id) and status in ('active','inactive'));
create policy "Owner updates offers" on public.offers for update to authenticated using (public.is_owner(auth.uid(),restaurant_id) and status <> 'suspended') with check (public.is_owner(auth.uid(),restaurant_id) and status in ('active','inactive'));
create policy "Admin updates offers" on public.offers for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Owner/admin delete offers" on public.offers for delete to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));

-- owners cannot tamper with counters
create or replace function public.offers_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('rm.internal', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then new.claims_count := 0; new.uses_count := 0; new.created_by := auth.uid();
  else new.claims_count := old.claims_count; new.uses_count := old.uses_count; new.restaurant_id := old.restaurant_id; new.created_by := old.created_by; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger offers_guard before insert or update on public.offers for each row execute function public.offers_guard();

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  reserved_date date not null,
  reserved_time text not null,
  people int not null check (people between 1 and 50),
  name text not null,
  phone text not null,
  email text,
  notes text,
  coupon_id uuid,
  status text not null default 'pending' check (status in ('pending','confirmed','canceled','no_show','completed')),
  status_changed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  offer_id uuid not null references public.offers(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'claimed' check (status in ('claimed','used','void')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  validated_by uuid,
  bill_amount numeric,
  reservation_id uuid references public.reservations(id) on delete set null
);
alter table public.reservations add constraint reservations_coupon_fk foreign key (coupon_id) references public.coupons(id) on delete set null;

grant select, insert on public.reservations to authenticated;
grant select on public.coupons to authenticated;
grant all on public.reservations, public.coupons to service_role;
alter table public.reservations enable row level security;
alter table public.coupons enable row level security;
create policy "User creates own reservation" on public.reservations for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "Read reservations" on public.reservations for select to authenticated using (user_id = auth.uid() or public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));
create policy "Read coupons" on public.coupons for select to authenticated using (user_id = auth.uid() or public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  amount numeric not null,
  currency text not null,
  status text not null default 'due' check (status in ('due','void','paid')),
  created_at timestamptz not null default now(),
  voided_at timestamptz
);
grant select on public.commissions to authenticated;
grant all on public.commissions to service_role;
alter table public.commissions enable row level security;
create policy "Owner/admin read commissions" on public.commissions for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));

create table public.profile_views (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index profile_views_rid_idx on public.profile_views(restaurant_id, viewed_at);
grant insert on public.profile_views to anon, authenticated;
grant select on public.profile_views to authenticated;
grant all on public.profile_views to service_role;
alter table public.profile_views enable row level security;
create policy "Anyone logs a view" on public.profile_views for insert with check (true);
create policy "Owner/admin read views" on public.profile_views for select to authenticated using (public.is_owner(auth.uid(),restaurant_id) or public.has_role(auth.uid(),'admin'));

create table public.coupon_attempts (
  id bigint generated always as identity primary key,
  user_id uuid,
  code text,
  ok boolean not null,
  created_at timestamptz not null default now()
);
grant all on public.coupon_attempts to service_role;
alter table public.coupon_attempts enable row level security;

create index coupons_user_idx on public.coupons(user_id);
create index coupons_offer_idx on public.coupons(offer_id);
create index reservations_rid_idx on public.reservations(restaurant_id);
create index reservations_uid_idx on public.reservations(user_id);
create index offers_rid_idx on public.offers(restaurant_id);
create index campaigns_rid_idx on public.campaigns(restaurant_id);

-- ===== Reservation triggers =====
create or replace function public.reservations_before_insert() returns trigger language plpgsql security definer set search_path = public as $$
declare c record; o record;
begin
  if new.reserved_date < (now() at time zone 'Europe/Bucharest')::date then raise exception 'Data rezervării nu poate fi în trecut.'; end if;
  if new.coupon_id is not null then
    select * into c from public.coupons where id = new.coupon_id for update;
    if c is null or c.user_id <> new.user_id or c.restaurant_id <> new.restaurant_id then raise exception 'Cuponul nu aparține acestui cont sau restaurant.'; end if;
    if c.status <> 'claimed' or c.expires_at <= now() then raise exception 'Cuponul nu mai este valabil.'; end if;
    if c.reservation_id is not null then raise exception 'Cuponul este deja atașat altei rezervări.'; end if;
    select * into o from public.offers where id = c.offer_id;
    if o.min_people is not null and new.people < o.min_people then raise exception 'Oferta necesită minimum % persoane.', o.min_people; end if;
    if new.reserved_date > o.ends_on then raise exception 'Oferta expiră înainte de data rezervării.'; end if;
    if not (extract(isodow from new.reserved_date)::smallint = any(o.valid_days)) then raise exception 'Oferta nu este valabilă în ziua aleasă.'; end if;
  end if;
  new.status := 'pending';
  return new;
end $$;
create trigger reservations_before_insert before insert on public.reservations for each row execute function public.reservations_before_insert();

create or replace function public.reservations_after_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.coupon_id is not null then update public.coupons set reservation_id = new.id where id = new.coupon_id; end if;
  return new;
end $$;
create trigger reservations_after_insert after insert on public.reservations for each row execute function public.reservations_after_insert();

-- commission: one per reservation (unique), created on confirmation, voided on cancel / no-show
create or replace function public.reservations_commission() returns trigger language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if new.status = old.status then return new; end if;
  select * into s from public.app_settings where id = 1;
  if new.status = 'confirmed' then
    insert into public.commissions (reservation_id, restaurant_id, amount, currency)
    values (new.id, new.restaurant_id, s.commission_amount, s.commission_currency)
    on conflict (reservation_id) do update set status = 'due', voided_at = null where public.commissions.status = 'void';
  elsif new.status = 'canceled' or (new.status = 'no_show' and not s.commission_on_no_show) then
    update public.commissions set status = 'void', voided_at = now() where reservation_id = new.id and status = 'due';
  end if;
  return new;
end $$;
create trigger reservations_commission after update on public.reservations for each row execute function public.reservations_commission();

create or replace function public.set_reservation_status(_id uuid, _status text) returns public.reservations
language plpgsql security definer set search_path = public as $$
declare r public.reservations; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Autentificare necesară.'; end if;
  select * into r from public.reservations where id = _id for update;
  if r is null then raise exception 'Rezervarea nu există.'; end if;
  if r.user_id = uid and not public.is_owner(uid, r.restaurant_id) then
    if _status <> 'canceled' or r.status not in ('pending','confirmed') then raise exception 'Poți doar anula o rezervare activă.'; end if;
  elsif public.is_owner(uid, r.restaurant_id) or public.has_role(uid,'admin') then
    if not ((r.status='pending' and _status in ('confirmed','canceled')) or (r.status='confirmed' and _status in ('completed','no_show','canceled'))) then
      raise exception 'Tranziție de status nepermisă: % → %', r.status, _status;
    end if;
  else raise exception 'Nu ai acces la această rezervare.'; end if;
  update public.reservations set status=_status, status_changed_at=now() where id=_id returning * into r;
  if _status in ('canceled','no_show') and r.coupon_id is not null then
    update public.coupons set reservation_id = null where id = r.coupon_id and status = 'claimed';
  end if;
  return r;
end $$;

-- ===== Coupon RPCs =====
create or replace function public.claim_offer(_offer_id uuid) returns public.coupons
language plpgsql security definer set search_path = public as $$
declare o public.offers; uid uuid := auth.uid(); n int; c public.coupons; code text; today date := (now() at time zone 'Europe/Bucharest')::date;
begin
  if uid is null then raise exception 'Trebuie să fii autentificat pentru a revendica oferta.'; end if;
  select * into o from public.offers where id = _offer_id for update;
  if o is null or o.status <> 'active' then raise exception 'Oferta nu este activă.'; end if;
  if not exists (select 1 from public.restaurants where id=o.restaurant_id and status='approved') then raise exception 'Restaurantul nu este activ.'; end if;
  if not public.plan_allows_offers(o.restaurant_id) then raise exception 'Oferta nu mai este disponibilă.'; end if;
  if today < o.starts_on then raise exception 'Oferta începe pe %.', o.starts_on; end if;
  if today > o.ends_on then raise exception 'Oferta a expirat.'; end if;
  select count(*) into n from public.coupons where offer_id=o.id and user_id=uid and status in ('claimed','used') and (status='used' or expires_at>now());
  if n >= o.max_uses_per_user then raise exception 'Ai atins numărul maxim de utilizări pentru această ofertă.'; end if;
  if o.max_uses is not null then
    select count(*) into n from public.coupons where offer_id=o.id and (status='used' or (status='claimed' and expires_at>now()));
    if n >= o.max_uses then raise exception 'Oferta a fost epuizată.'; end if;
  end if;
  loop
    code := 'RM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
    exit when not exists (select 1 from public.coupons where coupons.code = code);
  end loop;
  insert into public.coupons (code, offer_id, restaurant_id, user_id, expires_at)
  values (code, o.id, o.restaurant_id, uid, ((o.ends_on + 1)::timestamp at time zone 'Europe/Bucharest'))
  returning * into c;
  perform set_config('rm.internal','1',true);
  update public.offers set claims_count = claims_count + 1 where id = o.id;
  perform set_config('rm.internal','0',true);
  return c;
end $$;

create or replace function public.coupon_check(_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.coupons; o public.offers; uid uuid := auth.uid(); fails int; reasons text[] := '{}'; now_l timestamp := now() at time zone 'Europe/Bucharest'; res public.reservations; used_n int;
begin
  if uid is null then raise exception 'Autentificare necesară.'; end if;
  select count(*) into fails from public.coupon_attempts where user_id=uid and not ok and created_at > now() - interval '10 minutes';
  if fails >= 15 then raise exception 'Prea multe încercări eșuate. Încearcă din nou peste 10 minute.'; end if;
  select * into c from public.coupons where code = upper(trim(_code));
  if c is null or not (public.is_owner(uid, c.restaurant_id) or public.has_role(uid,'admin')) then
    insert into public.coupon_attempts(user_id, code, ok) values (uid, left(_code,40), false);
    return jsonb_build_object('found', false, 'valid', false, 'reasons', jsonb_build_array('Cod inexistent sau emis pentru alt restaurant.'));
  end if;
  insert into public.coupon_attempts(user_id, code, ok) values (uid, c.code, true);
  select * into o from public.offers where id = c.offer_id;
  if c.status = 'used' then reasons := reasons || ('Cupon deja folosit la ' || to_char(c.used_at at time zone 'Europe/Bucharest','DD.MM.YYYY HH24:MI'));
  elsif c.status = 'void' then reasons := reasons || 'Cupon anulat.'::text;
  elsif c.expires_at <= now() then reasons := reasons || 'Cupon expirat.'::text; end if;
  if o.status <> 'active' then reasons := reasons || 'Oferta nu mai este activă.'::text; end if;
  if not (extract(isodow from now_l)::smallint = any(o.valid_days)) then reasons := reasons || 'Oferta nu este valabilă în ziua de azi.'::text; end if;
  if o.time_from is not null and o.time_to is not null and not (now_l::time between o.time_from and o.time_to) then
    reasons := reasons || ('Oferta este valabilă doar între ' || to_char(o.time_from,'HH24:MI') || ' și ' || to_char(o.time_to,'HH24:MI'));
  end if;
  if o.max_uses is not null then
    select count(*) into used_n from public.coupons where offer_id=o.id and status='used';
    if used_n >= o.max_uses and c.status <> 'used' then reasons := reasons || 'Oferta a fost epuizată.'::text; end if;
  end if;
  if c.reservation_id is not null then select * into res from public.reservations where id = c.reservation_id; end if;
  if o.requires_reservation and (res.id is null or res.status not in ('pending','confirmed','completed')) then
    reasons := reasons || 'Oferta necesită o rezervare făcută prin RestoMatch.'::text;
  end if;
  return jsonb_build_object('found', true, 'valid', coalesce(array_length(reasons,1),0) = 0, 'reasons', to_jsonb(reasons),
    'code', c.code, 'status', c.status, 'issued_at', c.issued_at, 'expires_at', c.expires_at, 'used_at', c.used_at,
    'offer', to_jsonb(o),
    'reservation', case when res.id is null then null else jsonb_build_object('id',res.id,'date',res.reserved_date,'time',res.reserved_time,'people',res.people,'name',res.name,'status',res.status) end);
end $$;

create or replace function public.redeem_coupon(_code text, _bill_amount numeric default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.coupons; o public.offers; chk jsonb; uid uuid := auth.uid();
begin
  chk := public.coupon_check(_code);
  if not (chk->>'valid')::boolean then raise exception '%', coalesce(chk->'reasons'->>0, 'Cupon invalid.'); end if;
  select * into c from public.coupons where code = upper(trim(_code)) for update;
  if c.status <> 'claimed' or c.expires_at <= now() then raise exception 'Cuponul nu mai poate fi folosit.'; end if;
  select * into o from public.offers where id = c.offer_id for update;
  if o.min_bill is not null then
    if _bill_amount is null then raise exception 'Introdu valoarea notei (minimum % %).', o.min_bill, o.currency; end if;
    if _bill_amount < o.min_bill then raise exception 'Nota este sub valoarea minimă de % %.', o.min_bill, o.currency; end if;
  end if;
  update public.coupons set status='used', used_at=now(), validated_by=uid, bill_amount=_bill_amount where id=c.id and status='claimed' returning * into c;
  if c is null then raise exception 'Cuponul a fost deja validat.'; end if;
  perform set_config('rm.internal','1',true);
  update public.offers set uses_count = uses_count + 1 where id = o.id;
  perform set_config('rm.internal','0',true);
  return jsonb_build_object('ok', true, 'code', c.code, 'used_at', c.used_at);
end $$;

-- ===== Subscription / campaign RPCs =====
create or replace function public.select_plan(_rid bigint, _plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.subscription_plans; s public.subscriptions; pay public.payments; uid uuid := auth.uid();
begin
  if not (public.is_owner(uid,_rid) or public.has_role(uid,'admin')) then raise exception 'Nu administrezi acest restaurant.'; end if;
  select * into p from public.subscription_plans where code=_plan and active;
  if p is null then raise exception 'Plan inexistent.'; end if;
  -- drop any previous unpaid request
  update public.payments set status='canceled' where restaurant_id=_rid and kind='subscription' and status='pending';
  update public.subscriptions set status='canceled' where restaurant_id=_rid and status='pending_payment';
  if p.price = 0 then
    update public.subscriptions set cancel_at_period_end = true where restaurant_id=_rid and status='active';
    return jsonb_build_object('ok', true, 'message', 'Abonamentul plătit nu se va reînnoi; după data de sfârșit vei trece pe FREE.');
  end if;
  insert into public.subscriptions (restaurant_id, plan_code, status, price, currency, created_by)
  values (_rid, p.code, 'pending_payment', p.price, p.currency, uid) returning * into s;
  insert into public.payments (restaurant_id, kind, subscription_id, amount, currency, description)
  values (_rid, 'subscription', s.id, p.price, p.currency, 'Abonament ' || p.name || ' – 1 lună') returning * into pay;
  return jsonb_build_object('ok', true, 'subscription_id', s.id, 'payment_id', pay.id);
end $$;

create or replace function public.cancel_subscription(_rid bigint, _resume boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_owner(auth.uid(),_rid) or public.has_role(auth.uid(),'admin')) then raise exception 'Nu administrezi acest restaurant.'; end if;
  update public.subscriptions set cancel_at_period_end = not _resume where restaurant_id=_rid and status='active';
end $$;

create or replace function public.buy_campaign(_rid bigint, _package_id uuid, _city text default null, _cuisine text default null, _offer_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k public.campaign_packages; cmp public.campaigns; pay public.payments; uid uuid := auth.uid();
begin
  if not (public.is_owner(uid,_rid) or public.has_role(uid,'admin')) then raise exception 'Nu administrezi acest restaurant.'; end if;
  select * into k from public.campaign_packages where id=_package_id and active;
  if k is null then raise exception 'Pachet indisponibil.'; end if;
  if k.type='offer' and (_offer_id is null or not exists (select 1 from public.offers where id=_offer_id and restaurant_id=_rid)) then raise exception 'Alege oferta de promovat.'; end if;
  if k.type='category_city' and _city is null and _cuisine is null then raise exception 'Alege orașul sau categoria.'; end if;
  insert into public.campaigns (restaurant_id, package_id, type, days, price, currency, target_city, target_cuisine, offer_id, created_by)
  values (_rid, k.id, k.type, k.days, k.price, k.currency, _city, _cuisine, _offer_id, uid) returning * into cmp;
  insert into public.payments (restaurant_id, kind, campaign_id, amount, currency, description)
  values (_rid, 'campaign', cmp.id, k.price, k.currency, k.name || ' – ' || k.days || ' zile') returning * into pay;
  return jsonb_build_object('ok', true, 'campaign_id', cmp.id, 'payment_id', pay.id);
end $$;

create or replace function public.cancel_campaign(_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare cmp public.campaigns;
begin
  select * into cmp from public.campaigns where id=_id;
  if cmp is null or not (public.is_owner(auth.uid(),cmp.restaurant_id) or public.has_role(auth.uid(),'admin')) then raise exception 'Fără acces.'; end if;
  if cmp.status <> 'pending_payment' then raise exception 'Doar campaniile neplătite pot fi anulate.'; end if;
  update public.campaigns set status='canceled' where id=_id;
  update public.payments set status='canceled' where campaign_id=_id and status='pending';
end $$;

-- payment confirmation: internal (webhook via service role) + admin wrapper (manual/offline payments)
create or replace function public.confirm_payment_internal(_payment_id uuid, _provider text, _provider_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare pay public.payments; s public.subscriptions; cmp public.campaigns; base timestamptz;
begin
  select * into pay from public.payments where id=_payment_id for update;
  if pay is null then raise exception 'Plată inexistentă.'; end if;
  if pay.status = 'paid' then return; end if;
  if pay.status <> 'pending' then raise exception 'Plata are statusul %.', pay.status; end if;
  update public.payments set status='paid', paid_at=now(), provider=_provider, provider_ref=_provider_ref where id=pay.id;
  if pay.kind='subscription' then
    select * into s from public.subscriptions where id=pay.subscription_id for update;
    -- renewal of same plan extends; plan change replaces
    select max(current_period_end) into base from public.subscriptions where restaurant_id=s.restaurant_id and status='active' and plan_code=s.plan_code and current_period_end>now();
    update public.subscriptions set status='canceled', cancel_at_period_end=true where restaurant_id=s.restaurant_id and status='active' and id<>s.id;
    update public.subscriptions set status='active', provider=_provider, provider_ref=_provider_ref,
      current_period_start=coalesce(base, now()), current_period_end=coalesce(base, now()) + interval '1 month', cancel_at_period_end=false
      where id=s.id;
  else
    select * into cmp from public.campaigns where id=pay.campaign_id for update;
    update public.campaigns set status='active', starts_at=now(), ends_at=now() + make_interval(days => cmp.days) where id=cmp.id;
  end if;
end $$;
revoke execute on function public.confirm_payment_internal(uuid,text,text) from public, anon, authenticated;
grant execute on function public.confirm_payment_internal(uuid,text,text) to service_role;

create or replace function public.admin_set_payment(_payment_id uuid, _status text, _ref text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Doar administratorii.'; end if;
  if _status = 'paid' then perform public.confirm_payment_internal(_payment_id, 'manual', coalesce(_ref, 'manual-' || _payment_id::text));
  elsif _status = 'failed' then
    update public.payments set status='failed' where id=_payment_id and status='pending';
  else raise exception 'Status invalid.'; end if;
end $$;

create or replace function public.owner_update_restaurant(_rid bigint, _patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(auth.uid(),_rid) then raise exception 'Nu administrezi acest restaurant.'; end if;
  update public.restaurants set
    description = coalesce(_patch->>'description', description),
    phone = coalesce(_patch->>'phone', phone),
    website = coalesce(_patch->>'website', website),
    instagram = coalesce(_patch->>'instagram', instagram),
    hours = coalesce(_patch->>'hours', hours),
    address = coalesce(_patch->>'address', address)
  where id=_rid;
end $$;

-- ===== Public monetization signals (badges, promoted, offers) =====
create or replace function public.public_monetization() returns jsonb
language sql stable security definer set search_path = public as $$
  with prem as (
    select distinct s.restaurant_id from public.subscriptions s join public.subscription_plans p on p.code=s.plan_code
    where s.status='active' and s.current_period_end>now() and p.has_badge
  ), prio as (
    select distinct s.restaurant_id from public.subscriptions s join public.subscription_plans p on p.code=s.plan_code
    where s.status='active' and s.current_period_end>now() and p.priority_ranking
  ), home as (
    select distinct s.restaurant_id from public.subscriptions s join public.subscription_plans p on p.code=s.plan_code
    where s.status='active' and s.current_period_end>now() and p.homepage_feature
  ), camp as (
    select restaurant_id, jsonb_agg(jsonb_build_object('type',type,'city',target_city,'cuisine',target_cuisine,'offer_id',offer_id,'ends_at',ends_at)) promos
    from public.campaigns where status='active' and now() between starts_at and ends_at group by restaurant_id
  ), offs as (
    select o.restaurant_id, count(*) n,
      max(case when o.discount_type='percent' then o.discount_value end) best_pct,
      max(case when o.discount_type='fixed' then o.discount_value end) best_fixed,
      min(o.ends_on) soonest, bool_or(o.exclusive) excl
    from public.offers o join public.restaurants r on r.id=o.restaurant_id and r.status='approved'
    where o.status='active' and current_date between o.starts_on and o.ends_on and public.plan_allows_offers(o.restaurant_id)
    group by o.restaurant_id
  ), ids as (select restaurant_id from prem union select restaurant_id from prio union select restaurant_id from camp union select restaurant_id from offs union select restaurant_id from home)
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ids.restaurant_id,
    'premium', ids.restaurant_id in (select restaurant_id from prem),
    'priority', ids.restaurant_id in (select restaurant_id from prio),
    'homepage', ids.restaurant_id in (select restaurant_id from home),
    'promos', coalesce(camp.promos,'[]'::jsonb),
    'offers', coalesce(offs.n,0), 'bestPct', offs.best_pct, 'bestFixed', offs.best_fixed, 'offerEnds', offs.soonest, 'exclusive', coalesce(offs.excl,false)
  )), '[]'::jsonb)
  from ids left join camp on camp.restaurant_id=ids.restaurant_id left join offs on offs.restaurant_id=ids.restaurant_id
  join public.restaurants r on r.id = ids.restaurant_id and r.status='approved'
$$;

-- ===== Stats =====
create or replace function public.restaurant_stats(_rid bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  if not (public.is_owner(auth.uid(),_rid) or public.has_role(auth.uid(),'admin')) then raise exception 'Fără acces.'; end if;
  select jsonb_build_object(
    'plan', public.restaurant_plan(_rid),
    'views', (select count(*) from public.profile_views where restaurant_id=_rid),
    'views30', (select count(*) from public.profile_views where restaurant_id=_rid and viewed_at > now()-interval '30 days'),
    'viewsDaily', (select coalesce(jsonb_agg(jsonb_build_object('day',d,'n',coalesce(n,0)) order by d),'[]') from (
        select gs::date d, (select count(*) from public.profile_views v where v.restaurant_id=_rid and (v.viewed_at at time zone 'Europe/Bucharest')::date = gs::date) n
        from generate_series(current_date - 13, current_date, interval '1 day') gs) t),
    'reservations', (select count(*) from public.reservations where restaurant_id=_rid),
    'confirmed', (select count(*) from public.reservations where restaurant_id=_rid and status in ('confirmed','completed')),
    'canceled', (select count(*) from public.reservations where restaurant_id=_rid and status in ('canceled','no_show')),
    'claimed', (select count(*) from public.coupons where restaurant_id=_rid),
    'used', (select count(*) from public.coupons where restaurant_id=_rid and status='used'),
    'offerCustomers', (select count(distinct user_id) from public.coupons where restaurant_id=_rid and status='used'),
    'subscriptionCost', (select coalesce(sum(amount),0) from public.payments where restaurant_id=_rid and kind='subscription' and status='paid'),
    'campaignCost', (select coalesce(sum(amount),0) from public.payments where restaurant_id=_rid and kind='campaign' and status='paid'),
    'commissionDue', (select coalesce(sum(amount),0) from public.commissions where restaurant_id=_rid and status='due'),
    'commissionCount', (select count(*) from public.commissions where restaurant_id=_rid and status='due'),
    'commissionCurrency', (select commission_currency from public.app_settings where id=1)
  ) into res;
  return res;
end $$;

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Doar administratorii.'; end if;
  return jsonb_build_object(
    'subscriptionRevenue', (select coalesce(sum(amount),0) from public.payments where kind='subscription' and status='paid'),
    'campaignRevenue', (select coalesce(sum(amount),0) from public.payments where kind='campaign' and status='paid'),
    'pendingPayments', (select count(*) from public.payments where status='pending'),
    'commissionDue', (select coalesce(sum(amount),0) from public.commissions where status='due'),
    'commissionCount', (select count(*) from public.commissions where status='due'),
    'commissionVoid', (select count(*) from public.commissions where status='void'),
    'activeOffers', (select count(*) from public.offers where status='active' and current_date between starts_on and ends_on),
    'claimed', (select count(*) from public.coupons),
    'used', (select count(*) from public.coupons where status='used'),
    'activeRestaurants', (select count(*) from public.restaurants where status='approved'),
    'payingRestaurants', (select count(distinct restaurant_id) from public.subscriptions where status='active' and current_period_end>now() and price>0),
    'activeCampaigns', (select count(*) from public.campaigns where status='active' and now() between starts_at and ends_at),
    'pendingClaims', (select count(*) from public.restaurant_owners where status='pending')
  );
end $$;

revoke execute on function public.restaurant_stats(bigint), public.admin_overview(), public.claim_offer(uuid), public.coupon_check(text), public.redeem_coupon(text,numeric), public.select_plan(bigint,text), public.cancel_subscription(bigint,boolean), public.buy_campaign(bigint,uuid,text,text,uuid), public.cancel_campaign(uuid), public.admin_set_payment(uuid,text,text), public.owner_update_restaurant(bigint,jsonb), public.set_reservation_status(uuid,text) from anon;
