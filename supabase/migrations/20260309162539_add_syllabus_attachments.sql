/*
  # Add syllabus attachments support

  1. New Tables
    - `syllabus_attachments`
      - `id` (uuid, primary key)
      - `module_id` (uuid, foreign key to modules)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text) - mime type
      - `file_size` (integer) - in bytes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `syllabus_attachments` table
    - Add policy for users to read attachments from their own modules
    - Add policy for users to insert attachments to their own modules
    - Add policy for users to delete their own syllabus attachments
*/

CREATE TABLE IF NOT EXISTS syllabus_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE syllabus_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments from their own modules"
  ON syllabus_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to their own modules"
  ON syllabus_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own syllabus attachments"
  ON syllabus_attachments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = syllabus_attachments.module_id
      AND modules.user_id = auth.uid()
    )
  );
