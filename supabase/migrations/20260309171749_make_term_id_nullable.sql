/*
  # Make term_id nullable for manual lessons

  1. Changes
    - Alter `lessons.term_id` to allow NULL values
    - This enables creating standalone lessons that aren't tied to a term
    - Auto-generated lessons from terms will still have term_id populated
    - Manual lessons can have NULL term_id

  2. Notes
    - Maintains foreign key relationship when term_id is present
    - No data loss - existing lessons remain unchanged
*/

ALTER TABLE lessons
ALTER COLUMN term_id DROP NOT NULL;
