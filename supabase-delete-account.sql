-- NeuroSync: allow signed-in users to permanently delete their own account.
-- Run once in Supabase → SQL Editor.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Remove public profile row first (safe if missing / no FK cascade).
  delete from public.profiles where id = uid;

  -- Delete the Auth user (cascades to auth-owned data).
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
