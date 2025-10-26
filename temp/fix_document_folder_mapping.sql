-- Fix document to folder mapping by matching paths
-- This will match documents.path to folders.full_path

-- Step 1: Show current state
SELECT 
  'BEFORE FIX - Documents with null folder_id' as description,
  COUNT(*) as count 
FROM documents 
WHERE folder_id IS NULL;

-- Step 2: Update documents with folder_id based on path matching
-- Match documents to the folder with the longest matching path (most specific)
UPDATE documents d
SET folder_id = (
  SELECT f.id 
  FROM folders f
  WHERE d.path IS NOT NULL 
    AND d.path LIKE '%' || f.full_path || '%'
  ORDER BY LENGTH(f.full_path) DESC
  LIMIT 1
)
WHERE d.folder_id IS NULL 
  AND d.path IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM folders f 
    WHERE d.path LIKE '%' || f.full_path || '%'
  );

-- Step 3: Show results
SELECT 
  'AFTER FIX - Documents with null folder_id' as description,
  COUNT(*) as count 
FROM documents 
WHERE folder_id IS NULL;

SELECT 
  'AFTER FIX - Documents with folder_id assigned' as description,
  COUNT(*) as count 
FROM documents 
WHERE folder_id IS NOT NULL;

-- Step 4: Refresh the materialized view
REFRESH MATERIALIZED VIEW folder_document_counts;

SELECT 'Materialized view folder_document_counts refreshed' as status;

-- Step 5: Show folders with document counts
SELECT 
  f.name,
  f.full_path,
  COALESCE(fdc.document_count, 0) as document_count
FROM folders f
LEFT JOIN folder_document_counts fdc ON fdc.folder_id = f.id
ORDER BY document_count DESC, f.full_path
LIMIT 30;
