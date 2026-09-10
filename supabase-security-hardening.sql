-- NeuroSync security hardening (run in Supabase SQL Editor)
-- Goal: stop world-readable emails / over-broad profile access while keeping friend features usable.

-- 1) Prefer username-based public profile reads; hide email from casual selects.
--    (Friend lookup by email should use a dedicated RPC, not select * from profiles.)

alter table public.profiles enable row level security;

-- Drop overly permissive "anyone can read all profiles" if it exists (name may vary).
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view all profiles" on public.profiles;

-- Authenticated users can read limited profile fields via policies below.
-- Note: RLS cannot hide columns; for true email privacy, stop selecting email in the app
-- and/or move emails off public profiles.

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read others usernames"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Keep update/insert own-row policies if missing:
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2) Ensure admin writes on learning_resources require is_admin (defense in depth)
-- (Re-assert if needed — adjust names to match your existing policies.)

-- 3) Restrict resource_usage public reads if you do not need global stats public:
-- drop policy if exists "Anyone can read resource usage" on public.resource_usage;
-- create policy "Users read own usage" on public.resource_usage for select using (auth.uid() = user_id);
-- create policy "Admins read all usage" on public.resource_usage for select
--   using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- 4) Set yourself as admin (replace with your auth user uuid from Authentication → Users):
-- update public.profiles set is_admin = true where email = 'you@example.com';
