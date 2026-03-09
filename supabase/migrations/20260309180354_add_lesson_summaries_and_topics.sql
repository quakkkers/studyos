/*
  # Add Lesson Summaries and Topics

  1. Changes
    - Add `topic` column to lessons table for lesson titles
    - Add `ai_summary` column to lessons table for condensed key points
    - Add `key_concepts` JSONB column for structured learning points

  2. Purpose
    - Enable AI-generated summaries of each lesson
    - Store key concepts for quick revision overview
    - Support topic-based navigation and search
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'topic'
  ) THEN
    ALTER TABLE lessons ADD COLUMN topic text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE lessons ADD COLUMN ai_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'key_concepts'
  ) THEN
    ALTER TABLE lessons ADD COLUMN key_concepts jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;