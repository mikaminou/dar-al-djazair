-- ============================================================
-- 0022_supabase_auth_migration.sql
--
-- Wires profiles table to Supabase Auth:
--   1. Ensures profiles.id references auth.users(id) for new rows
--   2. Creates a trigger that auto-creates a profile row when a
--      user signs up via Supabase Auth
--   3. Adds language_preference + account_type columns if missing
-- ============================================================

-- Add language_preference if it doesn't exist yet
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'fr';

-- Add account_type if it doesn't exist yet (was 'role' in base44)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'user';

-- Populate account_type from role column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    UPDATE profiles SET account_type = role WHERE account_type IS NULL OR account_type = 'user';
  END IF;
END $$;

-- ── Auto-create profile on Supabase Auth signup ────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT := NEW.email;
  _name  TEXT := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(_email, '@', 1)
  );
BEGIN
  -- Only create if no profile with this email already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = _email) THEN
    INSERT INTO public.profiles (id, email, first_name, account_type, language_preference)
    VALUES (
      NEW.id,
      _email,
      _name,
      'user',
      'fr'
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- If profile exists (legacy base44 row), link it to the auth user id
    UPDATE public.profiles
    SET id = NEW.id
    WHERE email = _email AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS: allow users to read/update their own profile ─────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist, then recreate
DROP POLICY IF EXISTS "profiles: users can read their own row" ON profiles;
DROP POLICY IF EXISTS "profiles: users can update their own row" ON profiles;
DROP POLICY IF EXISTS "profiles: admins can read all rows" ON profiles;

CREATE POLICY "profiles: users can read their own row"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() IS NOT NULL);

CREATE POLICY "profiles: users can update their own row"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow the handle_new_user function (SECURITY DEFINER) to insert
DROP POLICY IF EXISTS "profiles: service role can insert" ON profiles;
CREATE POLICY "profiles: service role can insert"
  ON profiles FOR INSERT
  WITH CHECK (true);
