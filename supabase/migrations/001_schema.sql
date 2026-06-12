-- WM26 Tippspiel Schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#F4C430',
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  code text primary key,
  name text not null,
  flag_emoji text not null,
  group_name text
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'WM26 Freunde',
  invite_code text not null unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  fifa_match_id int unique,
  home_team_code text not null references public.teams(code),
  away_team_code text not null references public.teams(code),
  kickoff_at timestamptz not null,
  stage text not null default 'group',
  group_name text,
  home_score int,
  away_score int,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  created_at timestamptz not null default now()
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score int not null check (home_score >= 0 and home_score <= 20),
  away_score int not null check (away_score >= 0 and away_score <= 20),
  submitted_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  points int not null default 0,
  breakdown text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists idx_matches_kickoff on public.matches(kickoff_at);
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_tips_match on public.tips(match_id);
create index if not exists idx_tips_user on public.tips(user_id);
create index if not exists idx_points_user on public.points_ledger(user_id);

create or replace function public.check_tip_deadline()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.matches m
    where m.id = new.match_id
      and m.kickoff_at <= now()
  ) then
    raise exception 'Tippzeit abgelaufen';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_tip_deadline on public.tips;
create trigger trg_check_tip_deadline
  before insert or update on public.tips
  for each row execute function public.check_tip_deadline();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#F4C430')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.calculate_match_points(
  tip_home int, tip_away int,
  result_home int, result_away int
)
returns table(points int, breakdown text)
language plpgsql
immutable
as $$
declare
  tip_diff int := tip_home - tip_away;
  result_diff int := result_home - result_away;
  tip_tendency int;
  result_tendency int;
begin
  if tip_home = result_home and tip_away = result_away then
    return query select 4, 'Exaktes Ergebnis'::text;
    return;
  end if;

  if result_home = result_away then
    if tip_home = tip_away then
      return query select 3, 'Richtiges Unentschieden'::text;
    else
      return query select 0, 'Kein Treffer'::text;
    end if;
  end if;

  tip_tendency := case when tip_home > tip_away then 1 when tip_home < tip_away then -1 else 0 end;
  result_tendency := case when result_home > result_away then 1 when result_home < result_away then -1 else 0 end;

  if tip_tendency = result_tendency then
    if tip_diff = result_diff then
      return query select 3, 'Richtige Tordifferenz'::text;
    else
      return query select 2, 'Richtige Tendenz'::text;
    end if;
  end if;

  return query select 0, 'Kein Treffer'::text;
end;
$$;

create or replace function public.recalculate_match_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  tip record;
  calc record;
begin
  if new.status = 'finished'
     and new.home_score is not null
     and new.away_score is not null
     and (old.home_score is distinct from new.home_score
          or old.away_score is distinct from new.away_score
          or old.status is distinct from new.status) then
    for tip in select * from public.tips where match_id = new.id loop
      select * into calc from public.calculate_match_points(
        tip.home_score, tip.away_score,
        new.home_score, new.away_score
      );
      insert into public.points_ledger (user_id, match_id, points, breakdown)
      values (tip.user_id, new.id, calc.points, calc.breakdown)
      on conflict (user_id, match_id)
      do update set points = excluded.points, breakdown = excluded.breakdown;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recalculate_points on public.matches;
create trigger trg_recalculate_points
  after update on public.matches
  for each row execute function public.recalculate_match_points();

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.tips enable row level security;
alter table public.points_ledger enable row level security;

-- RLS helpers (SECURITY DEFINER avoids infinite recursion in policies)
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

create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

create policy "teams_select" on public.teams for select to authenticated using (true);
create policy "matches_select" on public.matches for select to authenticated using (true);

create policy "leagues_select_member" on public.leagues for select
  using (public.is_league_member(id));

create policy "leagues_insert" on public.leagues for insert
  with check (created_by = auth.uid());

create policy "league_members_select" on public.league_members for select
  using (public.is_league_member(league_id));

create policy "league_members_insert_self" on public.league_members for insert
  with check (user_id = auth.uid());

create policy "tips_select_own" on public.tips for select
  using (user_id = auth.uid());

create policy "tips_select_others_after_own" on public.tips for select
  using (
    user_id != auth.uid()
    and public.has_own_tip_for_match(match_id)
  );

create policy "tips_insert_own" on public.tips for insert
  with check (user_id = auth.uid());

create policy "tips_update_own" on public.tips for update
  using (user_id = auth.uid());

create policy "points_select_league" on public.points_ledger for select
  using (public.shares_league_with(user_id));

create policy "matches_update_admin" on public.matches for update
  using (public.is_league_admin());
