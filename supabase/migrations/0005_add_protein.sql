-- Add protein (grams) to food entries and the scan-deduction RPC.
-- The n8n webhook now returns protein per item + a total; the app stores the
-- per-entry protein and sums it client-side for the dashboard. daily_logs is
-- intentionally left unchanged (calories remain the only rolled-up total).

alter table food_entries
  add column protein int not null default 0 check (protein >= 0);

-- Drop the old 4-arg signature so a 4-arg call can't become ambiguous against
-- the new defaulted 5-arg one. The app always sends protein now.
drop function if exists add_food_entry(text, int, date, int);

-- Recreate add_food_entry with a trailing p_protein param (defaulted for safety).
-- total_consumed is still the recomputed SUM(calories) — protein is not tracked
-- on daily_logs.
create or replace function add_food_entry(
  p_food_name text,
  p_calories int,
  p_date date,
  p_target int,
  p_protein int default 0
)
returns food_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_log_id uuid;
  v_entry food_entries;
begin
  select id into v_profile_id from user_profiles where user_id = auth.uid();
  if v_profile_id is null then
    raise exception 'No profile for current user';
  end if;
  if p_calories < 0 then
    raise exception 'Calories must be non-negative';
  end if;
  if p_protein < 0 then
    raise exception 'Protein must be non-negative';
  end if;

  insert into daily_logs (user_profile_id, date, total_target)
  values (v_profile_id, p_date, p_target)
  on conflict (user_profile_id, date) do nothing;

  select id into v_log_id
  from daily_logs
  where user_profile_id = v_profile_id and date = p_date;

  insert into food_entries (daily_log_id, food_name, calories, protein)
  values (v_log_id, p_food_name, p_calories, p_protein)
  returning * into v_entry;

  -- Recompute from the source of truth (the entries) rather than incrementing.
  update daily_logs
  set total_consumed = (
    select coalesce(sum(calories), 0) from food_entries where daily_log_id = v_log_id
  )
  where id = v_log_id;

  return v_entry;
end;
$$;

-- Grants for the new 5-arg signature.
revoke execute on function add_food_entry(text, int, date, int, int) from public, anon;
grant execute on function add_food_entry(text, int, date, int, int) to authenticated;
