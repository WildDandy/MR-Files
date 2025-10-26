# Fix Folder Filter on Classify Page

## Problem

Folder filter on classify page returns "No documents in this priority" even though selected folders should contain documents. Root cause: documents have `folder_id = null` due to import path mismatches.

## Investigation Steps

### 1. Verify the Data Issue

Add debug logging to confirm the hypothesis:

- Log selected folder IDs when filter is applied
- Log the SQL query being executed
- Check if documents exist with `folder_id = null`
- Check if selected folders have any documents with matching `folder_id`

**File**: `components/classification-interface.tsx`

- Add console.log in `fetchUnclassifiedDocuments` (line ~193) to show selected folder IDs
- Add console.log to show total documents before/after folder filter
- Add console.log in `onApplyFilters` callback (line ~2479) to show which folders are selected

### 2. Add Database Diagnostics

Create a temporary SQL check to run in Supabase SQL Editor:

```sql
-- Check documents with null folder_id
SELECT COUNT(*) as null_folder_count 
FROM documents 
WHERE folder_id IS NULL;

-- Check documents with folder_id set
SELECT COUNT(*) as with_folder_count 
FROM documents 
WHERE folder_id IS NOT NULL;

-- Check if selected folders have documents
SELECT f.id, f.name, f.full_path, COUNT(d.id) as doc_count
FROM folders f
LEFT JOIN documents d ON d.folder_id = f.id
WHERE f.id IN ('paste-selected-folder-ids-here')
GROUP BY f.id, f.name, f.full_path;
```

## Fix Options

### Option A: Match Documents to Folders (Recommended)

If documents have a `path` column that contains folder information, create a script to populate `folder_id`:

**New file**: `temp/fix_document_folder_mapping.sql`

```sql
-- Normalize and match documents to folders based on path
UPDATE documents d
SET folder_id = (
  SELECT f.id 
  FROM folders f
  WHERE d.path LIKE '%' || f.full_path || '%'
  ORDER BY LENGTH(f.full_path) DESC
  LIMIT 1
)
WHERE d.folder_id IS NULL AND d.path IS NOT NULL;
```

### Option B: Enhance Filter Query to Handle Null folder_id

Modify the filter logic to also show documents without folder assignment when no filter is active, or add an option to include unassigned documents:

**File**: `components/classification-interface.tsx`

- In `fetchUnclassifiedDocuments` (~line 193): Change query from strict `in("folder_id", selectedFolderIds)` to include a null-handling strategy
- In `fetchClassifiedDocuments` (~line 243): Apply same change

### Option C: Add "Unassigned" Folder Option

Add a virtual folder for documents without `folder_id`:

- Show documents with `folder_id = null` as "Unassigned" folder in filter
- Allow filtering by "Unassigned" specifically

## Implementation Priority

1. **First**: Add debug logging (Step 1) to confirm the issue
2. **Second**: Run database diagnostics (Step 2) to see the data distribution
3. **Third**: Choose fix based on findings:

   - If most documents have paths → use Option A
   - If paths are unreliable → use Option B or C

## Files to Modify

- `components/classification-interface.tsx` - Add debug logging and potentially modify query logic
- `temp/fix_document_folder_mapping.sql` - New SQL script for Option A
- Potentially `components/folder-tree.tsx` - If implementing Option C

## Testing Steps

1. Open browser console while on `/classify` page
2. Select folders and click "Apply Filters"
3. Check console logs for selected folder IDs and query results
4. Verify if documents appear after implementing chosen fix
5. Test edge cases: no folders selected, all folders selected, single folder selected