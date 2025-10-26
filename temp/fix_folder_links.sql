-- Fix Folder Links - Alternative Approach
-- This script links documents to folders by matching the path field
-- Run this after ensuring folders table is populated

BEGIN;

-- Show current status
SELECT 
  'Before Update' as status,
  (SELECT COUNT(*) FROM documents WHERE folder_id IS NOT NULL) as linked_documents;

-- Update documents that have a path with backslashes (in folders)
-- This matches documents to folders by checking if the document's path starts with the folder's full_path
UPDATE documents d
SET folder_id = f.id
FROM folders f
WHERE 
  d.path IS NOT NULL 
  AND d.path LIKE f.full_path || '\%'
  AND d.folder_id IS NULL;

-- Alternative: Update by extracting folder path from document path
-- For documents where path contains backslashes
UPDATE documents
SET folder_id = (
  SELECT f.id 
  FROM folders f 
  WHERE documents.path LIKE f.full_path || '\%'
  ORDER BY LENGTH(f.full_path) DESC
  LIMIT 1
)
WHERE 
  path IS NOT NULL 
  AND path LIKE '%\%'
  AND folder_id IS NULL;

-- Show results
SELECT 
  'After Update' as status,
  (SELECT COUNT(*) FROM documents WHERE folder_id IS NOT NULL) as linked_documents,
  (SELECT COUNT(*) FROM documents WHERE folder_id IS NULL) as unlinked_documents;

-- Show sample of linked documents
SELECT 
  d.title,
  d.path,
  f.name as folder_name,
  f.full_path as folder_path
FROM documents d
LEFT JOIN folders f ON d.folder_id = f.id
WHERE d.path LIKE '%\%'
LIMIT 10;

COMMIT;

