-- Fix: infinite recursion in RLS policies (run once if 001_schema.sql was already applied)

drop policy if exists "league_members_select" on public.league_members;
drop policy if exists "leagues_select_member" on public.leagues;
drop policy if exists "profiles_select_league" on public.profiles;
drop policy if exists "points_select_league" on public.points_ledger;
drop policy if exists "tips_select_others_after_own" on public.tips;
drop policy if exists "matches_update_admin" on public.matches;

create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create or replace function public.shares_league_with(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.league_members lm1
    join public.league_members lm2 on lm1.league_id = lm2.league_id
    where lm1.user_id = auth.uid() and lm2.user_id = p_user_id
  );
$$;

create or replace function public.is_league_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.league_members
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_own_tip_for_match(p_match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tips
    where match_id = p_match_id and user_id = auth.uid()
  );
$$;

create policy "profiles_select_league" on public.profiles for select
  using (id = auth.uid() or public.shares_league_with(id));

create policy "leagues_select_member" on public.leagues for select
  using (public.is_league_member(id));

create policy "league_members_select" on public.league_members for select
  using (public.is_league_member(league_id));

create policy "tips_select_others_after_own" on public.tips for select
  using (
    user_id != auth.uid()
    and public.has_own_tip_for_match(match_id)
  );

create policy "points_select_league" on public.points_ledger for select
  using (public.shares_league_with(user_id));

create policy "matches_update_admin" on public.matches for update
  using (public.is_league_admin());
