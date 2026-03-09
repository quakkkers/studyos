/*
  # Add lesson attachments support

  1. New Tables
    - `lesson_attachments`
      - `id` (uuid, primary key)
      - `lesson_id` (uuid, foreign key to lessons)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text) - mime type
      - `file_size` (integer) - in bytes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `lesson_attachments` table
    - Add policy for users to read attachments from their own lessons
    - Add policy for users to insert attachments to their own lessons
    - Add policy for users to delete their own lesson attachments
*/

CREATE TABLE IF NOT EXISTS lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments from their own lessons"
  ON lesson_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to their own lessons"
  ON lesson_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own lesson attachments"
  ON lesson_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN modules ON modules.id = lessons.module_id
      WHERE lessons.id = lesson_attachments.lesson_id
      AND modules.user_id = auth.uid()
    )
  );
