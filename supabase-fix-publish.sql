-- Neurosync: fix flashcard publish + chat share
-- Run once in Supabase → SQL Editor → New query → paste all → Run

alter table public.shared_decks add column if not exists shared_with_user_id uuid references auth.users on delete set null;

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

do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_members'
  ) then
    execute 'drop policy if exists "Members can read community_members" on public.community_members';
    execute 'create policy "Members can read community_members" on public.community_members for select using (true)';
  end if;
end $$;

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
