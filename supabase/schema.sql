-- =====================================================================
-- StudentMarket — Supabase setup for the web app
--
-- Built on top of the team's existing tables (profiles, marketplace_listings,
-- marketplace_categories, marketplace_favorites, notifications, merch_items,
-- announcements). Nothing is dropped and no existing rows are changed.
-- This script only ADDS what the app needs:
--   * extra listing/profile columns (condition, campus, pickup spot, swaps…)
--   * messages + orders tables
--   * notification triggers, a photo storage bucket and realtime
--
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again.
-- =====================================================================

-- ---------- profiles: extra student details ----------
alter table public.profiles add column if not exists campus text;
alter table public.profiles add column if not exists course text;
alter table public.profiles add column if not exists year_of_study text;
alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists status_reason text;
do $ begin
  alter table public.profiles add constraint profiles_role_check check (role in ('student', 'admin'));
exception when duplicate_object then null; end $;
do $ begin
  alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active', 'restricted', 'banned'));
exception when duplicate_object then null; end $;

-- Is the signed-in user an active admin? (security definer so RLS can call it safely)
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $
  select exists (select 1 from profiles where id = uid and role = 'admin' and account_status = 'active');
$;

-- Only CPUT emails may register: students @mycput.ac.za, staff/admins @cput.ac.za
create or replace function public.enforce_cput_email()
returns trigger language plpgsql security definer set search_path = public as $
begin
  if new.email is null or lower(new.email) !~ '@(mycput|cput)\.ac\.za
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'student' and account_status = 'active');

-- New sign-ups get a profile with a unique username (profiles.username is NOT NULL + UNIQUE).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1), 'student'), '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 3 then base := base || 'student'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, full_name, campus, role)
  values (new.id, candidate,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          nullif(new.raw_user_meta_data->>'campus', ''),
          case when lower(new.email) like '%@cput.ac.za' then 'admin' else 'student' end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- listings: details shown on the cards ----------
alter table public.marketplace_listings add column if not exists condition text not null default 'Good';
alter table public.marketplace_listings add column if not exists campus text;
alter table public.marketplace_listings add column if not exists pickup_spot text;
alter table public.marketplace_listings add column if not exists open_to_swap boolean not null default false;

insert into public.marketplace_categories (name) values ('Res essentials')
on conflict (name) do nothing;

-- ---------- messages (buyer <-> seller) ----------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references public.marketplace_listings(id) on delete set null,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at);
alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Users send messages as themselves" on public.messages;
create policy "Users send messages as themselves" on public.messages
  for insert with check (auth.uid() = sender_id and sender_id <> recipient_id);
drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read" on public.messages
  for update using (auth.uid() = recipient_id);

-- ---------- merch orders ----------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  items      jsonb not null,
  total      numeric(10,2) not null check (total >= 0),
  status     text not null default 'placed',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "Users manage their own orders" on public.orders;
create policy "Users manage their own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- merch is read-only for the public ----------
alter table public.merch_items enable row level security;
drop policy if exists "Merch is viewable by everyone" on public.merch_items;
create policy "Merch is viewable by everyone" on public.merch_items for select using (true);

-- ---------- notifications: let users clear their own ----------
drop policy if exists "Users delete their own notifications" on public.notifications;
create policy "Users delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------- automatic notifications ----------
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare sender_name text; item_title text;
begin
  select coalesce(full_name, username) into sender_name from profiles where id = new.sender_id;
  select title into item_title from marketplace_listings where id = new.listing_id;
  insert into notifications (user_id, title, message, type, link_url)
  values (new.recipient_id,
          coalesce(sender_name, 'A student') || ' sent you a message',
          coalesce('About "' || item_title || '": ', '') || left(new.body, 120),
          'marketplace',
          'chat.html?with=' || new.sender_id || coalesce('&listing=' || new.listing_id, ''));
  return new;
end $$;
drop trigger if exists on_message_created on public.messages;
create trigger on_message_created after insert on public.messages
  for each row execute function public.notify_new_message();

create or replace function public.notify_listing_saved()
returns trigger language plpgsql security definer set search_path = public as $$
declare l record;
begin
  select id, title, seller_id into l from marketplace_listings where id = new.listing_id;
  if l.seller_id is not null and l.seller_id <> new.user_id then
    insert into notifications (user_id, title, message, type, link_url)
    values (l.seller_id, 'Someone saved your listing',
            '"' || l.title || '" is on a student''s shortlist.', 'marketplace',
            'marketplace.html?item=' || l.id);
  end if;
  return new;
end $$;
drop trigger if exists on_listing_saved on public.marketplace_favorites;
create trigger on_listing_saved after insert on public.marketplace_favorites
  for each row execute function public.notify_listing_saved();

create or replace function public.notify_order_placed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, message, type, link_url)
  values (new.user_id, 'Order confirmed',
          'Your merch order (R' || to_char(new.total, 'FM999999990.00') || ') is ready for collection at the campus store.',
          'system', 'profile.html#orders');
  return new;
end $$;
drop trigger if exists on_order_placed on public.orders;
create trigger on_order_placed after insert on public.orders
  for each row execute function public.notify_order_placed();

-- ---------- photo storage (public read, upload into your own folder) ----------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images are public" on storage.objects;
create policy "Listing images are public" on storage.objects
  for select using (bucket_id = 'listing-images');
drop policy if exists "Users upload to their own folder" on storage.objects;
create policy "Users upload to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete their own images" on storage.objects;
create policy "Users delete their own images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- realtime for chat + notifications ----------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;
 then
    raise exception 'CPUT_EMAIL_ONLY: Use your @mycput.ac.za (students) or @cput.ac.za (staff) email address.';
  end if;
  return new;
end $;
drop trigger if exists enforce_cput_email on auth.users;
create trigger enforce_cput_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_cput_email();

-- Users may edit their own profile, but never their own role or account status
create or replace function public.protect_profile_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $
begin
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status or new.status_reason is distinct from old.status_reason)
     and coalesce(current_setting('app.admin_action', true), '') <> 'on'
     and auth.uid() is not null then
    raise exception 'ADMIN_ONLY: Only admins can change roles or account status.';
  end if;
  return new;
end $;
drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- New sign-ups get a profile with a unique username (profiles.username is NOT NULL + UNIQUE).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1), 'student'), '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 3 then base := base || 'student'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, full_name, campus)
  values (new.id, candidate,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          nullif(new.raw_user_meta_data->>'campus', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- listings: details shown on the cards ----------
alter table public.marketplace_listings add column if not exists condition text not null default 'Good';
alter table public.marketplace_listings add column if not exists campus text;
alter table public.marketplace_listings add column if not exists pickup_spot text;
alter table public.marketplace_listings add column if not exists open_to_swap boolean not null default false;

insert into public.marketplace_categories (name) values ('Res essentials')
on conflict (name) do nothing;

-- ---------- messages (buyer <-> seller) ----------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references public.marketplace_listings(id) on delete set null,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 1000),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at);
alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Users send messages as themselves" on public.messages;
create policy "Users send messages as themselves" on public.messages
  for insert with check (auth.uid() = sender_id and sender_id <> recipient_id);
drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read" on public.messages
  for update using (auth.uid() = recipient_id);

-- ---------- merch orders ----------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  items      jsonb not null,
  total      numeric(10,2) not null check (total >= 0),
  status     text not null default 'placed',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "Users manage their own orders" on public.orders;
create policy "Users manage their own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- merch is read-only for the public ----------
alter table public.merch_items enable row level security;
drop policy if exists "Merch is viewable by everyone" on public.merch_items;
create policy "Merch is viewable by everyone" on public.merch_items for select using (true);

-- ---------- notifications: let users clear their own ----------
drop policy if exists "Users delete their own notifications" on public.notifications;
create policy "Users delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------- automatic notifications ----------
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare sender_name text; item_title text;
begin
  select coalesce(full_name, username) into sender_name from profiles where id = new.sender_id;
  select title into item_title from marketplace_listings where id = new.listing_id;
  insert into notifications (user_id, title, message, type, link_url)
  values (new.recipient_id,
          coalesce(sender_name, 'A student') || ' sent you a message',
          coalesce('About "' || item_title || '": ', '') || left(new.body, 120),
          'marketplace',
          'chat.html?with=' || new.sender_id || coalesce('&listing=' || new.listing_id, ''));
  return new;
end $$;
drop trigger if exists on_message_created on public.messages;
create trigger on_message_created after insert on public.messages
  for each row execute function public.notify_new_message();

create or replace function public.notify_listing_saved()
returns trigger language plpgsql security definer set search_path = public as $$
declare l record;
begin
  select id, title, seller_id into l from marketplace_listings where id = new.listing_id;
  if l.seller_id is not null and l.seller_id <> new.user_id then
    insert into notifications (user_id, title, message, type, link_url)
    values (l.seller_id, 'Someone saved your listing',
            '"' || l.title || '" is on a student''s shortlist.', 'marketplace',
            'marketplace.html?item=' || l.id);
  end if;
  return new;
end $$;
drop trigger if exists on_listing_saved on public.marketplace_favorites;
create trigger on_listing_saved after insert on public.marketplace_favorites
  for each row execute function public.notify_listing_saved();

create or replace function public.notify_order_placed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, title, message, type, link_url)
  values (new.user_id, 'Order confirmed',
          'Your merch order (R' || to_char(new.total, 'FM999999990.00') || ') is ready for collection at the campus store.',
          'system', 'profile.html#orders');
  return new;
end $$;
drop trigger if exists on_order_placed on public.orders;
create trigger on_order_placed after insert on public.orders
  for each row execute function public.notify_order_placed();

-- ---------- photo storage (public read, upload into your own folder) ----------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images are public" on storage.objects;
create policy "Listing images are public" on storage.objects
  for select using (bucket_id = 'listing-images');
drop policy if exists "Users upload to their own folder" on storage.objects;
create policy "Users upload to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete their own images" on storage.objects;
create policy "Users delete their own images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- realtime for chat + notifications ----------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- =====================================================================
-- MODERATION
-- =====================================================================

-- ---------- prohibited items (admins can add/remove terms) ----------
create table if not exists public.prohibited_terms (
  term       text primary key check (term = lower(term) and char_length(term) between 2 and 40),
  reason     text not null default 'Not allowed on StudentMarket',
  created_at timestamptz not null default now()
);
alter table public.prohibited_terms enable row level security;
drop policy if exists "Prohibited terms are public" on public.prohibited_terms;
create policy "Prohibited terms are public" on public.prohibited_terms for select using (true);
drop policy if exists "Admins manage prohibited terms" on public.prohibited_terms;
create policy "Admins manage prohibited terms" on public.prohibited_terms for all using (public.is_admin()) with check (public.is_admin());

insert into public.prohibited_terms (term, reason) values
  ('alcohol','Alcohol'), ('beer','Alcohol'), ('wine','Alcohol'), ('vodka','Alcohol'), ('whisky','Alcohol'), ('whiskey','Alcohol'),
  ('gin','Alcohol'), ('rum','Alcohol'), ('brandy','Alcohol'), ('tequila','Alcohol'), ('liquor','Alcohol'), ('cider','Alcohol'),
  ('champagne','Alcohol'), ('booze','Alcohol'), ('jagermeister','Alcohol'),
  ('weed','Drugs'), ('dagga','Drugs'), ('cannabis','Drugs'), ('marijuana','Drugs'), ('thc','Drugs'), ('cbd','Drugs'),
  ('edibles','Drugs'), ('kush','Drugs'), ('bong','Drugs'),
  ('cocaine','Drugs'), ('mdma','Drugs'), ('ecstasy','Drugs'), ('lsd','Drugs'),
  ('shrooms','Drugs'), ('meth','Drugs'), ('tik','Drugs'), ('mandrax','Drugs'), ('heroin','Drugs'), ('nyaope','Drugs'),
  ('xanax','Prescription medication'), ('codeine','Prescription medication'), ('ritalin','Prescription medication'),
  ('concerta','Prescription medication'), ('steroids','Prescription medication'), ('prescription meds','Prescription medication'),
  ('vape','Tobacco & vaping'), ('vapes','Tobacco & vaping'), ('vaping','Tobacco & vaping'), ('e-cigarette','Tobacco & vaping'),
  ('cigarette','Tobacco & vaping'), ('cigarettes','Tobacco & vaping'), ('tobacco','Tobacco & vaping'), ('hookah','Tobacco & vaping'),
  ('hubbly','Tobacco & vaping'), ('nicotine','Tobacco & vaping'), ('snus','Tobacco & vaping'),
  ('sex toy','Adult content'), ('sex toys','Adult content'), ('dildo','Adult content'), ('vibrator','Adult content'),
  ('porn','Adult content'), ('adult toy','Adult content'), ('fleshlight','Adult content'), ('escort','Adult content'), ('nudes','Adult content'),
  ('firearm','Weapons'), ('handgun','Weapons'), ('pistol','Weapons'), ('rifle','Weapons'), ('ammo','Weapons'),
  ('ammunition','Weapons'), ('taser','Weapons'), ('knuckle duster','Weapons'),
  ('fake id','Fraud'), ('counterfeit','Fraud'), ('stolen','Fraud'), ('exam answers','Academic dishonesty'),
  ('assignment writing','Academic dishonesty'), ('essay writing','Academic dishonesty')
on conflict (term) do nothing;

-- Returns the first prohibited term found in a piece of text (whole words only)
create or replace function public.find_prohibited_term(txt text)
returns text language sql stable security definer set search_path = public as $$
  select t.term from prohibited_terms t
  where lower(coalesce(txt, '')) ~ ('\m' || regexp_replace(t.term, '([.+*?^$()\[\]{}|\\-])', '\\\1', 'g') || '\M')
  order by length(t.term) desc limit 1;
$$;

create or replace function public.check_listing_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare bad text; st text;
begin
  if tg_op = 'INSERT' then
    select account_status into st from profiles where id = new.seller_id;
    if coalesce(st, 'active') <> 'active' then
      raise exception 'ACCOUNT_LIMITED: Your account can''t list items right now. Contact a StudentMarket admin.';
    end if;
  end if;
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description then
    bad := public.find_prohibited_term(new.title || ' ' || coalesce(new.description, ''));
    if bad is not null then
      raise exception 'PROHIBITED_ITEM: "%" can''t be sold on StudentMarket.', bad;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists check_listing_rules on public.marketplace_listings;
create trigger check_listing_rules
  before insert or update on public.marketplace_listings
  for each row execute function public.check_listing_rules();

-- Banned users can't message, save, order or report
create or replace function public.block_banned_users()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where id = auth.uid() and account_status = 'banned') then
    raise exception 'ACCOUNT_BANNED: This account has been banned by a StudentMarket admin.';
  end if;
  return new;
end $$;
drop trigger if exists block_banned_messages on public.messages;
create trigger block_banned_messages before insert on public.messages for each row execute function public.block_banned_users();
drop trigger if exists block_banned_favorites on public.marketplace_favorites;
create trigger block_banned_favorites before insert on public.marketplace_favorites for each row execute function public.block_banned_users();
drop trigger if exists block_banned_orders on public.orders;
create trigger block_banned_orders before insert on public.orders for each row execute function public.block_banned_users();

-- ---------- reports ----------
create table if not exists public.listing_reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.marketplace_listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null check (char_length(reason) between 3 and 300),
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now()
);
alter table public.listing_reports enable row level security;
drop policy if exists "Users report listings" on public.listing_reports;
create policy "Users report listings" on public.listing_reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "Admins read reports" on public.listing_reports;
create policy "Admins read reports" on public.listing_reports for select using (public.is_admin() or auth.uid() = reporter_id);
drop policy if exists "Admins update reports" on public.listing_reports;
create policy "Admins update reports" on public.listing_reports for update using (public.is_admin());
drop trigger if exists block_banned_reports on public.listing_reports;
create trigger block_banned_reports before insert on public.listing_reports for each row execute function public.block_banned_users();

-- ---------- admins have the final say on listings ----------
drop policy if exists "Admins can update any listing" on public.marketplace_listings;
create policy "Admins can update any listing" on public.marketplace_listings for update using (public.is_admin());
drop policy if exists "Admins can delete any listing" on public.marketplace_listings;
create policy "Admins can delete any listing" on public.marketplace_listings for delete using (public.is_admin());

-- ---------- admin actions (RPC) ----------
create or replace function public.admin_list_users()
returns table (id uuid, email text, username text, full_name text, campus text, role text, account_status text,
               status_reason text, avatar_url text, created_at timestamptz, listings bigint)
language plpgsql stable security definer set search_path = public as $
#variable_conflict use_column
begin
  if not public.is_admin() then raise exception 'ADMIN_ONLY: Admins only.'; end if;
  return query
    select p.id, u.email::text, p.username, p.full_name, coalesce(p.campus, p.location), p.role, p.account_status,
           p.status_reason, p.avatar_url, p.created_at,
           (select count(*) from marketplace_listings l where l.seller_id = p.id)
    from profiles p left join auth.users u on u.id = p.id
    order by p.created_at desc;
end $$;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_ONLY: Admins only.'; end if;
  if target = auth.uid() then raise exception 'You can''t change your own role.'; end if;
  if new_role not in ('student', 'admin') then raise exception 'Unknown role.'; end if;
  perform set_config('app.admin_action', 'on', true);
  update profiles set role = new_role where id = target;
  insert into notifications (user_id, title, message, type, link_url)
  values (target, case when new_role = 'admin' then 'You''re now a StudentMarket admin' else 'Your admin access was removed' end,
          case when new_role = 'admin' then 'You can now moderate users and listings from the admin dashboard.' else 'Your account is now a regular student account.' end,
          'system', case when new_role = 'admin' then 'admin.html' else 'profile.html' end);
end $$;

create or replace function public.admin_set_status(target uuid, new_status text, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_ONLY: Admins only.'; end if;
  if target = auth.uid() then raise exception 'You can''t change your own account status.'; end if;
  if new_status not in ('active', 'restricted', 'banned') then raise exception 'Unknown status.'; end if;
  perform set_config('app.admin_action', 'on', true);
  update profiles set account_status = new_status, status_reason = nullif(reason, '') where id = target;
  if new_status = 'banned' then
    update marketplace_listings set status = 'archived' where seller_id = target and status = 'active';
  end if;
  insert into notifications (user_id, title, message, type, link_url)
  values (target,
          case new_status when 'active' then 'Your account is back in good standing' when 'restricted' then 'Your account has been restricted' else 'Your account has been banned' end,
          coalesce(nullif(reason, ''), case new_status when 'active' then 'You can list and message again.' when 'restricted' then 'You can browse and chat, but you can''t list items for now.' else 'Contact a StudentMarket admin if you think this is a mistake.' end),
          'system', 'profile.html');
end $$;

create or replace function public.admin_remove_listing(target uuid, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare l record;
begin
  if not public.is_admin() then raise exception 'ADMIN_ONLY: Admins only.'; end if;
  select id, title, seller_id into l from marketplace_listings where id = target;
  if l.id is null then return; end if;
  delete from marketplace_listings where id = target;
  update listing_reports set status = 'resolved' where listing_id = target and status = 'open';
  insert into notifications (user_id, title, message, type, link_url)
  values (l.seller_id, 'A listing was removed by an admin',
          '"' || l.title || '" was removed' || coalesce(': ' || nullif(reason, ''), '.'), 'system', 'profile.html');
end $$;

grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.find_prohibited_term(text) to anon, authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_status(uuid, text, text) to authenticated;
grant execute on function public.admin_remove_listing(uuid, text) to authenticated;

-- ---------- first admin ----------
-- Anyone who signs up with an @cput.ac.za address becomes an admin automatically.
-- To promote an existing account by hand, run (replace the email):
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'someone@cput.ac.za');
