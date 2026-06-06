-- Fix: total_consumed drifted from the actual entries because it was kept as a
-- hand-maintained running tally (and delete subtract-and-clamped at 0, which
-- could wipe a day when undoing the latest entry). Recompute total_consumed as
-- SUM(food_entries.calories) inside both RPCs so it is always exact and
-- self-healing. Also repair any already-drifted rows.

create or replace function add_food_entry(p_food_name text, p_calories int, p_date date, p_target int)
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

  insert into daily_logs (user_profile_id, date, total_target)
  values (v_profile_id, p_date, p_target)
  on conflict (user_profile_id, date) do nothing;

  select id into v_log_id
  from daily_logs
  where user_profile_id = v_profile_id and date = p_date;

  insert into food_entries (daily_log_id, food_name, calories)
  values (v_log_id, p_food_name, p_calories)
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

create or replace function delete_food_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
  v_owner uuid;
begin
  select fe.daily_log_id, p.user_id
    into v_log_id, v_owner
  from food_entries fe
  join daily_logs l on l.id = fe.daily_log_id
  join user_profiles p on p.id = l.user_profile_id
  where fe.id = p_entry_id;

  if v_owner is null then
    raise exception 'Entry not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  delete from food_entries where id = p_entry_id;

  -- Recompute from the remaining entries (no subtract-and-clamp drift).
  update daily_logs
  set total_consumed = (
    select coalesce(sum(calories), 0) from food_entries where daily_log_id = v_log_id
  )
  where id = v_log_id;
end;
$$;

-- Preserve the original execution grants.
revoke execute on function add_food_entry(text, int, date, int) from public, anon;
revoke execute on function delete_food_entry(uuid) from public, anon;
grant execute on function add_food_entry(text, int, date, int) to authenticated;
grant execute on function delete_food_entry(uuid) to authenticated;

-- One-time repair: realign every log's total_consumed with its entries.
update daily_logs dl
set total_consumed = coalesce(
  (select sum(calories) from food_entries fe where fe.daily_log_id = dl.id),
  0
);
