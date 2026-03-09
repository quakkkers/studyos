/*
  # Remove Unused Database Indexes

  1. Cleanup
    - Drop unused index `idx_lessons_term_id` on lessons table
    - Drop unused index `idx_lessons_date` on lessons table
    - Drop unused index `idx_revision_sessions_user_id` on revision_sessions table
    - Drop unused index `idx_revision_sessions_module_id` on revision_sessions table
    - Drop unused index `idx_lesson_attachments_lesson_id` on lesson_attachments table

  2. Notes
    - These indexes were created but are not being utilized by queries
    - Foreign key constraints already provide adequate indexing for these relationships
    - Removing unused indexes improves write performance and reduces storage overhead
*/

-- Drop unused indexes if they exist
DROP INDEX IF EXISTS idx_lessons_term_id;
DROP INDEX IF EXISTS idx_lessons_date;
DROP INDEX IF EXISTS idx_revision_sessions_user_id;
DROP INDEX IF EXISTS idx_revision_sessions_module_id;
DROP INDEX IF EXISTS idx_lesson_attachments_lesson_id;
