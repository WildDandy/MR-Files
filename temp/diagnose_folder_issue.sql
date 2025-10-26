-- Diagnose folder assignment issue

-- 1. Check how many documents have null folder_id
SELECT 
  'Documents with null folder_id' as description,
  COUNT(*) as count 
FROM documents 
WHERE folder_id IS NULL;

-- 2. Check how many documents have folder_id assigned
SELECT 
  'Documents with folder_id assigned' as description,
  COUNT(*) as count 
FROM documents 
WHERE folder_id IS NOT NULL;

-- 3. Sample of documents with paths but no folder assignment
SELECT 
  id,
  title,
  path,
  folder_id
FROM documents 
WHERE folder_id IS NULL 
  AND path IS NOT NULL
LIMIT 10;

-- 4. Check sample of folders with their paths
SELECT 
  id,
  name,
  full_path,
  (SELECT COUNT(*) FROM documents d WHERE d.folder_id = f.id) as doc_count
FROM folders f
ORDER BY full_path
LIMIT 20;
