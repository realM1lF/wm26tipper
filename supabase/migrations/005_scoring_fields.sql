-- Explicit scoring basis (120-min for KO; penalties separate)

alter table public.matches
  add column if not exists scoring_home int,
  add column if not exists scoring_away int,
  add column if not exists decided_by text check (decided_by in ('regulation', 'extra_time', 'penalties')),
  add column if not exists pen_home int,
  add column if not exists pen_away int;

-- Backfill existing finished matches
update public.matches
set
  scoring_home = home_score,
  scoring_away = away_score,
  decided_by = 'regulation'
where status = 'finished'
  and home_score is not null
  and away_score is not null
  and scoring_home is null;

create or replace function public.recalculate_match_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  tip record;
  calc record;
  result_home int;
  result_away int;
begin
  result_home := coalesce(new.scoring_home, new.home_score);
  result_away := coalesce(new.scoring_away, new.away_score);

  if new.status = 'finished'
     and result_home is not null
     and result_away is not null
     and (old.scoring_home is distinct from new.scoring_home
          or old.scoring_away is distinct from new.scoring_away
          or old.home_score is distinct from new.home_score
          or old.away_score is distinct from new.away_score
          or old.status is distinct from new.status) then
    for tip in select * from public.tips where match_id = new.id loop
      select * into calc from public.calculate_match_points(
        tip.home_score, tip.away_score,
        result_home, result_away
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
