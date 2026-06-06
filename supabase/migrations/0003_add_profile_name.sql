-- Add an optional display name to user_profiles so the app can greet the user.
-- Nullable: existing rows stay valid. RLS update policy and the
-- trg_user_profiles_updated_at trigger from 0001 already cover this column.
ALTER TABLE public.user_profiles ADD COLUMN name text;
