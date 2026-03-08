/*
  # Add Missing Module Fields

  1. Changes
    - Add `emoji` column to modules table for module icons
    - Add `color` column to modules table for color themes
    - Add `subject_type` column to modules table (language, stem, essay, arts, other)

  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Sets default values for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE modules ADD COLUMN emoji text DEFAULT '📚';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'color'
  ) THEN
    ALTER TABLE modules ADD COLUMN color text DEFAULT 'amber';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules' AND column_name = 'subject_type'
  ) THEN
    ALTER TABLE modules ADD COLUMN subject_type text DEFAULT 'other';
  END IF;
END $$;