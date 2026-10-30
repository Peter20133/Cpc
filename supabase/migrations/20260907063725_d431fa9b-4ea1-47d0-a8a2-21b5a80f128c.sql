create table if not exists public.restaurants (
  id bigint generated always as identity primary key,
  name text not null,
  city text not null,
  cuisine text not null,
  cuisine_label text,
  mood text,
  price text not null default '€€',
  rating numeric not null default 0,
  distance text default '—',
  open_until text default '—',
  image text,
  address text,
  hours text,
  description text,
  dishes text[] not null default '{}',
  tags text[] not null default '{}',
  facilities text[] not null default '{}',
  menu jsonb not null default '[]',
  photos text[] not null default '{}',
  phone text,
  website text,
  instagram text,
  booking jsonb not null default '{"type":"phone","phone":""}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  osm_id bigint,
  osm_type text,
  data_source text,
  source_url text,
  latitude numeric,
  longitude numeric
);

create index if not exists restaurants_city_idx on public.restaurants (city);
create index if not exists restaurants_cuisine_idx on public.restaurants (cuisine);
create index if not exists restaurants_status_idx on public.restaurants (status);
create unique index if not exists restaurants_osm_identity_idx
  on public.restaurants (osm_type, osm_id)
  where osm_type is not null and osm_id is not null;

do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read their own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.restaurants to anon;
grant select, insert, update, delete on public.restaurants to authenticated;
grant all on public.restaurants to service_role;
alter table public.restaurants enable row level security;

create policy "Public can read approved restaurants"
  on public.restaurants for select
  using (status = 'approved');

create policy "Admins can read all restaurants"
  on public.restaurants for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can submit a pending restaurant"
  on public.restaurants for insert
  with check (status = 'pending');

create policy "Admins can update restaurants"
  on public.restaurants for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete restaurants"
  on public.restaurants for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_restaurant_catalog_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', count(*) filter (where status in ('approved', 'pending')),
    'approved', count(*) filter (where status = 'approved'),
    'pending', count(*) filter (where status = 'pending'),
    'cityCount', count(distinct city) filter (where status in ('approved', 'pending')),
    'cuisineCount', count(distinct cuisine) filter (where status in ('approved', 'pending'))
  )
  from public.restaurants;
$$;

revoke all on function public.get_restaurant_catalog_stats() from public;
grant execute on function public.get_restaurant_catalog_stats() to anon, authenticated;