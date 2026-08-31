/*
# Create user_profiles table

1. New Tables
- `user_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `nome` (text, display name)
  - `cargo` (text, role: "Administrador" or "Atendente")
  - `email` (text, user email)
  - `created_at` (timestamp)

2. Security
- Enable RLS on `user_profiles`.
- Authenticated users can read all profiles (shared staff directory).
- Users can insert their own profile row on signup.
- Users can update their own profile.
- Only admins can delete profiles (but we don't enforce that at DB level since both roles share data).

3. Notes
- This table stores extended user info that auth.users doesn't hold cleanly.
- On signup, the frontend calls supabase.auth.signUp() then upserts into this table.
- The id column matches auth.users.id for a 1:1 relationship.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text NOT NULL DEFAULT 'Atendente',
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_user_profiles" ON user_profiles;
CREATE POLICY "auth_select_user_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_user_profiles" ON user_profiles;
CREATE POLICY "auth_insert_user_profiles" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "auth_update_user_profiles" ON user_profiles;
CREATE POLICY "auth_update_user_profiles" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "auth_delete_user_profiles" ON user_profiles;
CREATE POLICY "auth_delete_user_profiles" ON user_profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);
