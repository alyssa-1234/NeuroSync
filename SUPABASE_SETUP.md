# Supabase Setup for Neurosync

To enable real authentication (instead of demo mode), follow these steps:

## 0. Serve the page over HTTP (required for real login)

**Do not open `desktop-preview.html` by double-clicking it** (file://). The Supabase script will not load and you’ll stay in demo mode.

- **In VS Code / Cursor:** Install the “Live Server” extension, right‑click `desktop-preview.html` → “Open with Live Server”. The page will open at `http://127.0.0.1:5500/...` (or similar).
- **From terminal:** In the project folder run `python3 -m http.server 8000` (or `npx serve .`), then open `http://localhost:8000/desktop-preview.html` in your browser.

Then do steps 1–3 below. Users will appear in Supabase **Authentication → Users** when they sign up through this URL.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization, name your project (e.g., "neurosync"), set a database password
4. Wait for the project to be created

## 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy the **anon public** key (under "Project API keys")

## 3. Add Credentials (server env — not in HTML)

Do **not** put the service_role key anywhere in the website.

**Production (Netlify):** Site settings → Environment variables:

- `SUPABASE_URL` = `https://your-project-id.supabase.co`
- `SUPABASE_ANON_KEY` = your **anon public** key

The site loads these from `/api/public-config` (see `netlify/functions/public-config.js`).

**Local testing:** copy `config.local.example.js` → `config.local.js` and fill in the same public values (that file is gitignored). Or use `netlify dev` with a `.env` file (see `.env.example`).

## 4. Run the Database Schema (Required for Friends & Chat – profiles table)

**Required** if you use **Friends** (add by email) or **Chat** (user list). Without it you may see: *"Could not find the table 'public.profiles' in the schema cache"*.

In your Supabase dashboard, go to **SQL Editor** and run this SQL to create the profiles table:

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  username text,
  created_at timestamptz default now()
);

-- Unique usernames (display names may repeat). Safe to re-run.
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    nullif(lower(trim(coalesce(new.raw_user_meta_data->>'username', ''))), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Look up any signed-up user by email (creates their profile row if missing)
create or replace function public.lookup_user_id_by_email(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
  uemail text;
  dname text;
begin
  select id, email, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
  into uid, uemail, dname
  from auth.users
  where lower(trim(email)) = lower(trim(lookup_email))
  limit 1;
  if uid is null then
    return null;
  end if;
  insert into public.profiles (id, email, display_name)
  values (uid, uemail, dname)
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return uid;
end;
$$;

grant execute on function public.lookup_user_id_by_email(text) to authenticated;

-- Sync every auth user into profiles (run automatically by the app before friend lookup)
create or replace function public.sync_missing_profiles()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  added int;
begin
  insert into public.profiles (id, email, display_name)
  select id, lower(trim(email)), coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
  from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id);
  get diagnostics added = row_count;
  update public.profiles p
  set email = lower(trim(u.email))
  from auth.users u
  where p.id = u.id and (p.email is null or trim(p.email) = '');
  return added;
end;
$$;

grant execute on function public.sync_missing_profiles() to authenticated;
```

**Friend lookup:** After running the SQL above, "Add friend" finds users by email even if they signed up before the profiles trigger existed. If you already ran Section 4 without these functions, run **only** the two `create or replace function` blocks + `grant` lines in a new SQL Editor query.

**Usernames (unique handles):** If your `profiles` table already exists without `username`, run this once in SQL Editor:

```sql
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;
```

Display names may repeat. Usernames may not.

## 5. Set the correct Site URL and Redirect URLs (important)

Invite emails and “confirm your email” links use the **Site URL** from Supabase. The default is `http://localhost:3000`, so links were sending users to the wrong place.

1. In the Supabase dashboard go to **Authentication** → **URL Configuration** (or **Authentication** → **Settings** and scroll to URL Configuration).
2. Set **Site URL** to the URL where your app actually runs:
   - **Local (python server on port 8000):** `http://localhost:8000` or `http://127.0.0.1:8000`
   - **Live Server (often 5500):** `http://127.0.0.1:5500`
   - **Production:** your real site, e.g. `https://yoursite.com`
3. Under **Redirect URLs**, add the same base URL with a wildcard so all paths work, e.g.:
   - `http://localhost:8000/**`
   - `http://127.0.0.1:8000/**`
   (Add both if you use both. For production, add e.g. `https://yoursite.com/**`.)

After this, invite and confirmation emails will link to your app (e.g. port 8000), not port 3000.

## 6. Configure Auth (Optional)

In Supabase dashboard → **Authentication** → **Settings**:
- You can disable "Confirm email" for faster testing (users can log in immediately after signup)

## 7. Usage Tracking (Who signed up & how often they use it)

To track which users signed up and how frequently they use the app, run this in the **SQL Editor**:

```sql
-- Table: one row per usage event (timer completed, flashcards reviewed, study time added, etc.)
create table if not exists public.user_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists user_activity_user_id_idx on public.user_activity (user_id);
create index if not exists user_activity_created_at_idx on public.user_activity (created_at);
create index if not exists user_activity_event_type_idx on public.user_activity (event_type);

alter table public.user_activity enable row level security;

-- Users can insert their own activity
create policy "Users can insert own activity" on public.user_activity
  for insert with check (auth.uid() = user_id);

-- Users can read their own activity (for stats in the app)
create policy "Users can read own activity" on public.user_activity
  for select using (auth.uid() = user_id);

-- Optional: allow a service role or admin to read all activity for analytics
-- create policy "Service can read all activity" on public.user_activity for select using (auth.jwt() ->> 'role' = 'service_role');
```

**Event types** the app sends: `signup`, `session_start`, `timer_complete`, `flashcards`, `study_time`.

**Example queries** (run in SQL Editor or use in an admin dashboard):

- All users who signed up: `select * from auth.users order by created_at desc;`
- Usage frequency per user:  
  `select user_id, date_trunc('day', created_at) as day, count(*) as events from public.user_activity group by user_id, date_trunc('day', created_at) order by day desc, events desc;`
- Most active users (last 7 days):  
  `select user_id, count(*) as events from public.user_activity where created_at > now() - interval '7 days' group by user_id order by events desc;`

## 8. Community (Chat & shared flashcard sets)

To enable **Chat** and **Shared flashcard sets**, run the SQL below. In **SQL Editor** → **New query**, copy **only** the lines from `-- Shared flashcard decks` through the line `  using (auth.uid() = from_user_id or auth.uid() = to_user_id);` — then **stop**. Do not copy the ` ``` ` or any text after it.

```sql
-- Shared flashcard decks (public so others can browse and copy)
create table if not exists public.shared_decks (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text default '',
  folder text default 'All sets',
  is_public boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.shared_deck_cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.shared_decks on delete cascade not null,
  term text not null,
  definition text not null,
  sort_order int default 0
);

alter table public.shared_decks enable row level security;
alter table public.shared_deck_cards enable row level security;

-- Anyone can read public decks and their cards
create policy "Anyone can read public shared_decks" on public.shared_decks for select using (is_public = true);
create policy "Users can insert own shared_decks" on public.shared_decks for insert with check (auth.uid() = owner_id);
create policy "Users can delete own shared_decks" on public.shared_decks for delete using (auth.uid() = owner_id);

create policy "Anyone can read cards of public decks" on public.shared_deck_cards for select
  using (exists (select 1 from public.shared_decks d where d.id = deck_id and d.is_public = true));
create policy "Users can insert cards for own decks" on public.shared_deck_cards for insert
  with check (exists (select 1 from public.shared_decks d where d.id = deck_id and d.owner_id = auth.uid()));

-- Chat messages (DMs between two users)
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_from_to on public.chat_messages (from_user_id, to_user_id);
create index if not exists chat_messages_created_at on public.chat_messages (created_at);

alter table public.chat_messages enable row level security;

create policy "Users can send messages as sender" on public.chat_messages for insert with check (auth.uid() = from_user_id);
create policy "Users can read messages they sent or received" on public.chat_messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
```
^^^ STOP copying here. Do not copy the line above (the ```) or anything below. ^^^

Ensure the **profiles** table exists (Section 4) so the app can list display names for Chat. Shared decks show owner via a join to profiles.

**If another user doesn’t appear in Community → Chat:** The list is built from the `profiles` table. If that user signed up before the `profiles` trigger existed (or the trigger didn’t run), they won’t have a row. Run this once in the **SQL Editor** to add missing users into `profiles`:

```sql
insert into public.profiles (id, email, display_name)
select id, email, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles);
```

**Realtime for Chat:** In Supabase go to **Database** → **Replication** and ensure the `chat_messages` table has **Realtime** enabled so new messages appear without refreshing.

**How to use Chat (1:1 messaging):**
1. Log in (Section 0–3: serve over HTTP, add credentials).
2. Ensure **Section 4** (profiles) and **Section 8** (chat_messages) SQL have been run.
3. In the app, open **Community** → **Chat**.
4. The left column lists all other users (from `profiles`). Click a user to open the conversation.
5. Type in the box and press **Send** or Enter. Messages are stored in `chat_messages` and, with Realtime enabled, appear for both users without refresh.
6. From **Friends**, you can click **Message** next to a friend to open Chat with that user.

## 9. Friends & Communities (add friends, message friends, groups that share flashcards)

**Required:** Run **Section 8** first (it creates the `shared_decks` table). Section 9 then adds friends/communities and updates `shared_decks`. If you get **"relation public.shared_decks does not exist"**, run Section 8’s SQL block, then run Section 9 again.

In Supabase, go to **SQL Editor** → **New query**. Copy **only** the SQL between the ```sql and ``` lines below (do not copy any of the surrounding text or the ``` markers). Paste into the editor and click **Run**.

```sql
-- Helper for community policies (avoids infinite recursion)
create or replace function public.is_community_member(p_community_id uuid, p_user_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.community_members where community_id = p_community_id and user_id = p_user_id);
$$;
grant execute on function public.is_community_member(uuid, uuid) to authenticated;

-- Friend requests: send request, accept/decline, then both are "friends"
create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

create index if not exists friend_requests_to_status on public.friend_requests (to_user_id, status);
alter table public.friend_requests enable row level security;

create policy "Users can see requests they sent or received" on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users can send friend requests" on public.friend_requests for insert with check (auth.uid() = from_user_id);
create policy "Recipient can update (accept/decline)" on public.friend_requests for update using (auth.uid() = to_user_id);

-- Communities (groups)
create table if not exists public.communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  created_by uuid references auth.users on delete set null,
  invite_code text unique,
  created_at timestamptz default now()
);

create table if not exists public.community_members (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique(community_id, user_id)
);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy "Anyone can read communities" on public.communities for select using (true);
create policy "Authenticated users can create communities" on public.communities for insert with check (auth.uid() = created_by);
create policy "Creator can update own community" on public.communities for update using (auth.uid() = created_by);

create policy "Members can read community_members" on public.community_members for select
  using (user_id = auth.uid() or public.is_community_member(community_id, auth.uid()));
create policy "Admins can add members" on public.community_members for insert
  with check (exists (select 1 from public.community_members m where m.community_id = community_members.community_id and m.user_id = auth.uid() and m.role = 'admin'));
create policy "Users can add themselves as member" on public.community_members for insert with check (auth.uid() = user_id);
create policy "User can leave" on public.community_members for delete using (auth.uid() = user_id);

-- Link shared decks to communities (optional). If community_id is set, only members see it.
alter table public.shared_decks add column if not exists community_id uuid references public.communities(id) on delete set null;
alter table public.shared_decks add column if not exists shared_with_user_id uuid references auth.users on delete set null;

-- Drop old policies; replace with ones that avoid infinite recursion
drop policy if exists "Anyone can read public shared_decks" on public.shared_decks;
drop policy if exists "Read public or own-community shared_decks" on public.shared_decks;
create policy "Read shared_decks" on public.shared_decks for select using (
  owner_id = auth.uid()
  or shared_with_user_id = auth.uid()
  or (is_public = true and community_id is null)
  or (community_id is not null and public.is_community_member(community_id, auth.uid()))
);

drop policy if exists "Users can insert shared_decks" on public.shared_decks;
drop policy if exists "Users can insert own shared_decks" on public.shared_decks;
create policy "Users can insert shared_decks" on public.shared_decks for insert with check (
  auth.uid() = owner_id
  and (community_id is null or public.is_community_member(community_id, auth.uid()))
);

drop policy if exists "Anyone can read cards of public decks" on public.shared_deck_cards;
drop policy if exists "Users can insert cards for own decks" on public.shared_deck_cards;
create policy "Read shared_deck_cards" on public.shared_deck_cards for select using (
  exists (
    select 1 from public.shared_decks d where d.id = deck_id and (
      d.owner_id = auth.uid()
      or d.shared_with_user_id = auth.uid()
      or (d.is_public = true and d.community_id is null)
      or (d.community_id is not null and public.is_community_member(d.community_id, auth.uid()))
    )
  )
);
create policy "Users can insert cards for own decks" on public.shared_deck_cards for insert
  with check (exists (select 1 from public.shared_decks d where d.id = deck_id and d.owner_id = auth.uid()));
```

**Note:** Section 9 requires the `is_community_member` helper from **Section 10** if you use communities. If you only need friends, chat, and publishing, run **Section 10** after Section 8/9.

**Troubleshooting:**

- **"infinite recursion detected in policy for relation community_members"** when publishing — Run **Section 10** below (one-time fix).

- **"Add friend" says "No user with that email"** — Run the `lookup_user_id_by_email` function in Section 4 (or the "Add missing profiles" SQL in Section 8). The friend must have signed up with that exact email. Both users need to log in at least once after the profiles setup.
- **"Create community" says table not found** — You need to run the SQL block above. Copy only the lines between ```sql and ``` (from `-- Friend requests` through the final `);`), paste into SQL Editor, and Run.
- **Invite codes** — When you create a community, the app shows a short code; others join by entering that code in the Communities tab.

## 10. Fix publish & share (required if publish fails)

If you see **"Database policy error"** or **"infinite recursion"** when publishing, copy **all** of the SQL below into Supabase → **SQL Editor** → **Run** (one time):

```sql
-- 1) Columns for private friend shares
alter table public.shared_decks add column if not exists shared_with_user_id uuid references auth.users on delete set null;

-- 2) Publish via function (bypasses broken RLS — the app uses this automatically)
create or replace function public.publish_shared_deck(
  p_title text,
  p_description text default '',
  p_folder text default 'All sets',
  p_is_public boolean default true,
  p_shared_with uuid default null,
  p_cards jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_deck_id uuid;
  v_card jsonb;
  v_i int := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.shared_decks (owner_id, title, description, folder, is_public, shared_with_user_id)
  values (v_uid, p_title, coalesce(p_description, ''), coalesce(p_folder, 'All sets'), coalesce(p_is_public, true), p_shared_with)
  returning id into v_deck_id;

  for v_card in select * from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb))
  loop
    insert into public.shared_deck_cards (deck_id, term, definition, sort_order)
    values (
      v_deck_id,
      coalesce(v_card->>'term', ''),
      coalesce(v_card->>'definition', ''),
      v_i
    );
    v_i := v_i + 1;
  end loop;

  return v_deck_id;
end;
$$;

grant execute on function public.publish_shared_deck(text, text, text, boolean, uuid, jsonb) to authenticated;

-- 3) Fetch deck for "Copy to my sets" (chat shares + public browse)
create or replace function public.fetch_shared_deck(p_deck_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_deck public.shared_decks%rowtype;
  v_cards jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_deck from public.shared_decks where id = p_deck_id;
  if not found then
    return null;
  end if;

  if v_deck.owner_id is distinct from v_uid
     and v_deck.shared_with_user_id is distinct from v_uid
     and not (v_deck.is_public = true) then
    raise exception 'Access denied';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'term', c.term,
    'definition', c.definition,
    'sort_order', c.sort_order
  ) order by c.sort_order), '[]'::jsonb)
  into v_cards
  from public.shared_deck_cards c
  where c.deck_id = p_deck_id;

  return jsonb_build_object(
    'id', v_deck.id,
    'title', v_deck.title,
    'description', v_deck.description,
    'folder', v_deck.folder,
    'cards', v_cards
  );
end;
$$;

grant execute on function public.fetch_shared_deck(uuid) to authenticated;

-- 4) Fix broken community_members policy if that table exists (stops infinite recursion)
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_members'
  ) then
    execute 'drop policy if exists "Members can read community_members" on public.community_members';
    execute 'create policy "Members can read community_members" on public.community_members for select using (true)';
  end if;
end $$;

-- 5) Simple shared_decks policies (no community_members recursion)
drop policy if exists "Anyone can read public shared_decks" on public.shared_decks;
drop policy if exists "Read public or own-community shared_decks" on public.shared_decks;
drop policy if exists "Read shared_decks" on public.shared_decks;
drop policy if exists "Users can insert shared_decks" on public.shared_decks;
drop policy if exists "Users can insert own shared_decks" on public.shared_decks;

create policy "read_shared_decks" on public.shared_decks for select using (
  is_public = true
  or owner_id = auth.uid()
  or shared_with_user_id = auth.uid()
);

create policy "insert_shared_decks" on public.shared_decks for insert with check (auth.uid() = owner_id);

create policy "delete_own_shared_decks" on public.shared_decks for delete using (auth.uid() = owner_id);

-- 6) Card policies
drop policy if exists "Anyone can read cards of public decks" on public.shared_deck_cards;
drop policy if exists "Read shared_deck_cards" on public.shared_deck_cards;
drop policy if exists "Users can insert cards for own decks" on public.shared_deck_cards;

create policy "read_shared_deck_cards" on public.shared_deck_cards for select using (
  exists (
    select 1 from public.shared_decks d
    where d.id = deck_id
      and (d.is_public = true or d.owner_id = auth.uid() or d.shared_with_user_id = auth.uid())
  )
);

create policy "insert_shared_deck_cards" on public.shared_deck_cards for insert with check (
  exists (select 1 from public.shared_decks d where d.id = deck_id and d.owner_id = auth.uid())
);
```

After **Run** succeeds, hard-refresh the app (`Cmd+Shift+R`) and try **Publish** again.

## 11. Learning Resources (Browse, Rate, Request, Approve)

The **Resources** tab lets students browse study tools by subject (e.g. Biology → Amoeba Sisters), rate and comment on how helpful they were, and submit new resource requests. Admins approve requests, check new reviews, remove reviews, and remove study resources.

### One-time setup

1. In Supabase go to **SQL Editor** → **New query**
2. Open `supabase-resources.sql` in this project folder, copy all of it, paste into the editor, and click **Run**
3. Make yourself an admin (replace with your email):

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

4. In `desktop-preview.html`, search for `RESOURCES_ADMIN_EMAILS` and add your email:

```javascript
var RESOURCES_ADMIN_EMAILS = ['you@example.com'];
```

5. Hard-refresh the app (`Cmd+Shift+R`) and open **Resources**

### How it works

| Action | Who | Result |
|--------|-----|--------|
| Browse by subject | Anyone | See approved resources |
| Rate & comment | Logged-in users | One review per user per resource |
| Request a resource | Logged-in users | Goes to **pending** queue |
| Approve / Reject | Admin only | Approved resources appear in Browse |
| Check / remove reviews | Admin only | **Resources → Admin → New reviews** |
| Remove a resource | Admin only | **Resources → Admin → Manage resources** |
| "I'm using this" | Logged-in users | Shows `X users from Neurosync use this` |
| Optional sub-ratings | Logged-in users | Score clarity, depth, accuracy, engagement, exam relevance, ease of use, and time efficiency |

### Tables

- `learning_resources` — subject, title, url, description, type, status (`pending` / `approved` / `rejected`)
- `resource_reviews` — star rating (1–5) + optional comment per user per resource
- `resource_usage` — per-resource usage markers (one row per user/resource) for social proof counts
- `profiles.is_admin` — set to `true` for accounts that can approve requests, remove reviews, and delete resources

If you already set up resources earlier, run `supabase-resources.sql` again after updates so new optional sub-rating columns and admin delete policies are added.

## Demo Mode

If you don't add Supabase credentials, the app runs in **demo mode** - you can sign up and log in with any email/password, and it stores the session in your browser. Usage is not sent to a server in demo mode. Add your credentials to enable real authentication and usage tracking.
