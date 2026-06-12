-- Knockout support: nullable teams + placeholder labels

alter table public.matches
  alter column home_team_code drop not null,
  alter column away_team_code drop not null;

alter table public.matches
  add column if not exists home_team_label text,
  add column if not exists away_team_label text;
