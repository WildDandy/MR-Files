-- Empty all documents from the database
-- This will delete all imported documents while keeping admin settings intact

-- Removed the ALTER SEQUENCE command that was causing the error
DELETE FROM documents;
