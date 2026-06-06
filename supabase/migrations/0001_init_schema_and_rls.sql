-- Calorie Tracker — initial schema + Row Level Security
-- Applied to Supabase project ref: prfdtbitzlmifvndkpni

-- Enums
create type biological_sex as enum ('MALE', 'FEMALE');
create type weight_goal as enum ('LOSE', 'MAINTAIN', 'GAIN');

-- Tables
create table user_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users(id) on delete cascade,
  biological_sex       biological_sex not null,
  age                  int not null check (age > 0 and age < 130),
  weight               double precision not null check (weight > 0),   -- kg
  height               double precision not null check (height > 0),   -- cm
  goal                 weight_goal not null,
  daily_calorie_target int not null check (daily_calorie_target > 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table daily_logs (
  id              uuid primary key default gen_random_uuid(),
  user_profile_id uuid not null references user_profiles(id) on delete cascade,
  date            date not null,
  total_target    int not null,
  total_consumed  int not null default 0,
  created_at      timestamptz not null default now(),
  unique (user_profile_id, date)
);
create index daily_logs_profile_date_idx on daily_logs (user_profile_id, date);

create table food_entries (
  id           uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  food_name    text not null,
  calories     int not null,
  scanned_at   timestamptz not null default now()
);
create index food_entries_daily_log_idx on food_entries (daily_log_id);

-- updated_at trigger (search_path pinned for security)
create or replace function set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

-- Row Level Security
alter table user_profiles enable row level security;
alter table daily_logs    enable row level security;
alter table food_entries  enable row level security;

create policy "user_profiles_select_own" on user_profiles
  for select using (user_id = (select auth.uid()));
create policy "user_profiles_insert_own" on user_profiles
  for insert with check (user_id = (select auth.uid()));
create policy "user_profiles_update_own" on user_profiles
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_profiles_delete_own" on user_profiles
  for delete using (user_id = (select auth.uid()));

create policy "daily_logs_all_own" on daily_logs
  for all
  using (exists (
    select 1 from user_profiles p
    where p.id = daily_logs.user_profile_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from user_profiles p
    where p.id = daily_logs.user_profile_id and p.user_id = (select auth.uid())
  ));

create policy "food_entries_all_own" on food_entries
  for all
  using (exists (
    select 1 from daily_logs l
    join user_profiles p on p.id = l.user_profile_id
    where l.id = food_entries.daily_log_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from daily_logs l
    join user_profiles p on p.id = l.user_profile_id
    where l.id = food_entries.daily_log_id and p.user_id = (select auth.uid())
  ));
