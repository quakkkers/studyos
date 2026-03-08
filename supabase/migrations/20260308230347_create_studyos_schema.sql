/*
  # StudyOS Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `display_name` (text)
      - `avatar_url` (text)
      - `color_palette` (text) - Selected color theme
      - `learning_style` (jsonb) - User's learning preferences
      - `has_completed_onboarding` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `modules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `subject` (text)
      - `lesson_day` (text)
      - `syllabus` (text)
      - `custom_instructions` (text)
      - `position` (integer) - For drag-and-drop ordering
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `terms`
      - `id` (uuid, primary key)
      - `module_id` (uuid, references modules)
      - `name` (text) - e.g., "Term 1", "Semester 1"
      - `start_date` (date)
      - `end_date` (date)
      - `position` (integer)
      - `created_at` (timestamptz)
    
    - `lessons`
      - `id` (uuid, primary key)
      - `term_id` (uuid, references terms)
      - `module_id` (uuid, references modules)
      - `lesson_number` (integer)
      - `date` (date)
      - `familiarity_level` (text)
      - `confusion_notes` (text)
      - `raw_notes` (text)
      - `structured_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `revision_sessions`
      - `id` (uuid, primary key)
      - `module_id` (uuid, references modules)
      - `user_id` (uuid, references user_profiles)
      - `messages` (jsonb) - Chat history
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own modules, lessons, and sessions
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  color_palette text DEFAULT 'ocean',
  learning_style jsonb DEFAULT '{}',
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Modules Table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text,
  lesson_day text,
  syllabus text,
  custom_instructions text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modules"
  ON modules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own modules"
  ON modules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own modules"
  ON modules FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Terms Table
CREATE TABLE IF NOT EXISTS terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view terms for their modules"
  ON terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert terms for their modules"
  ON terms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update terms for their modules"
  ON terms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete terms for their modules"
  ON terms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = auth.uid()
    )
  );

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  lesson_number integer NOT NULL,
  date date NOT NULL,
  familiarity_level text,
  confusion_notes text,
  raw_notes text,
  structured_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons for their modules"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lessons for their modules"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lessons for their modules"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lessons for their modules"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = auth.uid()
    )
  );

-- Revision Sessions Table
CREATE TABLE IF NOT EXISTS revision_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revision sessions"
  ON revision_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own revision sessions"
  ON revision_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own revision sessions"
  ON revision_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own revision sessions"
  ON revision_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_module_id ON terms(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_term_id ON lessons(term_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_user_id ON revision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sessions_module_id ON revision_sessions(module_id);