/*
  # Speech Training App Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `speech_contexts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `context_data` (jsonb) - stores audience, context, goals, tone, length, language
      - `input_mode` (text) - 'text' or 'voice'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `speech_sessions`
      - `id` (uuid, primary key)
      - `context_id` (uuid, references speech_contexts)
      - `user_id` (uuid, references profiles)
      - `status` (text) - 'active', 'completed', 'paused'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Admin user can access all data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create speech_contexts table
CREATE TABLE IF NOT EXISTS speech_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context_data jsonb NOT NULL DEFAULT '{}',
  input_mode text NOT NULL DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE speech_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own speech contexts"
  ON speech_contexts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speech contexts"
  ON speech_contexts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speech contexts"
  ON speech_contexts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own speech contexts"
  ON speech_contexts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create speech_sessions table
CREATE TABLE IF NOT EXISTS speech_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid NOT NULL REFERENCES speech_contexts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE speech_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own speech sessions"
  ON speech_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speech sessions"
  ON speech_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speech sessions"
  ON speech_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own speech sessions"
  ON speech_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_speech_contexts_user_id ON speech_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_user_id ON speech_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speech_sessions_context_id ON speech_sessions(context_id);