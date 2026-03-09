/*
  # Fix Security and Performance Issues

  ## Changes Made
  
  1. **Add Missing Indexes**
     - Add index on `lesson_attachments.lesson_id` for foreign key performance
     - Add index on `syllabus_attachments.module_id` for foreign key performance
  
  2. **Optimize RLS Policies**
     - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation of auth function for each row
     - Applies to all tables: user_profiles, modules, terms, lessons, revision_sessions, lesson_attachments, syllabus_attachments
  
  3. **Security Notes**
     - All existing RLS policies remain functionally identical
     - Performance improvements for queries at scale
     - Auth connection strategy and password protection are project-level settings (not handled via migration)
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_attachments_module_id ON syllabus_attachments(module_id);

-- Drop and recreate RLS policies for user_profiles with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Drop and recreate RLS policies for modules with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view own modules" ON modules;
DROP POLICY IF EXISTS "Users can insert own modules" ON modules;
DROP POLICY IF EXISTS "Users can update own modules" ON modules;
DROP POLICY IF EXISTS "Users can delete own modules" ON modules;

CREATE POLICY "Users can view own modules"
  ON modules FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own modules"
  ON modules FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own modules"
  ON modules FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate RLS policies for terms with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view terms for their modules" ON terms;
DROP POLICY IF EXISTS "Users can insert terms for their modules" ON terms;
DROP POLICY IF EXISTS "Users can update terms for their modules" ON terms;
DROP POLICY IF EXISTS "Users can delete terms for their modules" ON terms;

CREATE POLICY "Users can view terms for their modules"
  ON terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert terms for their modules"
  ON terms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update terms for their modules"
  ON terms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete terms for their modules"
  ON terms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = terms.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

-- Drop and recreate RLS policies for lessons with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view lessons for their modules" ON lessons;
DROP POLICY IF EXISTS "Users can insert lessons for their modules" ON lessons;
DROP POLICY IF EXISTS "Users can update lessons for their modules" ON lessons;
DROP POLICY IF EXISTS "Users can delete lessons for their modules" ON lessons;

CREATE POLICY "Users can view lessons for their modules"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert lessons for their modules"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update lessons for their modules"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete lessons for their modules"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = lessons.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

-- Drop and recreate RLS policies for revision_sessions with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view own revision sessions" ON revision_sessions;
DROP POLICY IF EXISTS "Users can insert own revision sessions" ON revision_sessions;
DROP POLICY IF EXISTS "Users can update own revision sessions" ON revision_sessions;
DROP POLICY IF EXISTS "Users can delete own revision sessions" ON revision_sessions;

CREATE POLICY "Users can view own revision sessions"
  ON revision_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own revision sessions"
  ON revision_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own revision sessions"
  ON revision_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own revision sessions"
  ON revision_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate RLS policies for lesson_attachments with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view attachments from their own lessons" ON lesson_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their own lessons" ON lesson_attachments;
DROP POLICY IF EXISTS "Users can delete their own lesson attachments" ON lesson_attachments;

CREATE POLICY "Users can view attachments from their own lessons"
  ON lesson_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments to their own lessons"
  ON lesson_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own lesson attachments"
  ON lesson_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = (select auth.uid())
    )
  );

-- Drop and recreate RLS policies for syllabus_attachments with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view attachments from their own modules" ON syllabus_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their own modules" ON syllabus_attachments;
DROP POLICY IF EXISTS "Users can delete their own syllabus attachments" ON syllabus_attachments;

CREATE POLICY "Users can view attachments from their own modules"
  ON syllabus_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments to their own modules"
  ON syllabus_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own syllabus attachments"
  ON syllabus_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = (select auth.uid())
    )
  );