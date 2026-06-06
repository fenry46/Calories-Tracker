-- Atomic RPCs backing the daily log + scan deduction flow.
-- All are SECURITY DEFINER but guarded by internal auth.uid() ownership checks,
-- and EXECUTE is restricted to the `authenticated` role.

create or replace function get_or_create_log(p_date date, p_target int)
returns daily_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_log daily_logs;
begin
  select id into v_profile_id from user_profiles where user_id = auth.uid();
  if v_profile_id is null then
    raise exception 'No profile for current user';
  end if;

  insert into daily_logs (user_profile_id, date, total_target)
  values (v_profile_id, p_date, p_target)
  on conflict (user_profile_id, date) do nothing;

  select * into v_log
  from daily_logs
  where user_profile_id = v_profile_id and date = p_date;

  return v_log;
end;
$$;

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

  update daily_logs
  set total_consumed = total_consumed + p_calories
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
  v_cal int;
  v_log_id uuid;
  v_owner uuid;
begin
  select fe.calories, fe.daily_log_id, p.user_id
    into v_cal, v_log_id, v_owner
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
  update daily_logs
  set total_consumed = greatest(0, total_consumed - v_cal)
  where id = v_log_id;
end;
$$;

revoke execute on function get_or_create_log(date, int) from public, anon;
revoke execute on function add_food_entry(text, int, date, int) from public, anon;
revoke execute on function delete_food_entry(uuid) from public, anon;
grant execute on function get_or_create_log(date, int) to authenticated;
grant execute on function add_food_entry(text, int, date, int) to authenticated;
grant execute on function delete_food_entry(uuid) to authenticated;
