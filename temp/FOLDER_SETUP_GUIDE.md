# Folder Filtering Setup Guide

This guide will walk you through setting up the folder-based filtering feature for the Document Classification System.

## Overview

The folder filtering feature allows you to:
- Filter unclassified documents by their Google Drive folder location
- Use a multi-select tree view to choose multiple folders
- Automatically include all subfolders when a parent folder is selected
- See document counts for each folder

## Step-by-Step Setup

### Step 1: Create the Folders Table

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `scripts/017_create_folders_table.sql`
   - This creates the `folders` table with parent-child relationships
   - Adds indexes for performance
   - Enables Row Level Security (RLS)
   - Creates policy to allow authenticated users to read folders

**Expected Result:** Folders table created successfully

### Step 2: Add Folder Reference to Documents Table

1. In the Supabase SQL Editor
2. Open and run `scripts/018_add_folder_id_to_documents.sql`
   - This adds a `folder_id` column to the `documents` table
   - Creates an index for the foreign key
   - Links documents to their folders

**Expected Result:** Documents table updated with folder_id column

### Step 3: Populate Folders and Link Documents

1. In the Supabase SQL Editor
2. Open and run `temp/populate_folders.sql`
   - This inserts **1,041 folders** into the folders table
   - Updates documents to link them to their folders
   - Processes the entire folder hierarchy from your CSV

**Expected Result:**
- 1,041 folders inserted
- ~23,547 documents linked to folders
- ~15 root-level documents (no folder)

**⚠️ Important:** This script may take 30-60 seconds to complete due to the large number of operations.

### Step 4: Verify the Setup

Run these verification queries in Supabase SQL Editor:

```sql
-- Check folders were created
SELECT COUNT(*) as total_folders FROM folders;
-- Expected: 1041

-- Check documents were linked
SELECT COUNT(*) as documents_with_folders 
FROM documents 
WHERE folder_id IS NOT NULL;
-- Expected: ~23,547

-- Check root documents
SELECT COUNT(*) as documents_without_folders 
FROM documents 
WHERE folder_id IS NULL;
-- Expected: ~15

-- Check folder hierarchy (top-level folders)
SELECT name, level, full_path 
FROM folders 
WHERE parent_id IS NULL 
ORDER BY name 
LIMIT 20;
```

### Step 5: Test the Feature

1. **Start your development server** (if not already running):
   ```powershell
   npm run dev
   ```

2. **Navigate to the Classify page** in your browser

3. **Look for the "Filter by Folder" button** next to the search bar

4. **Click the button** to open the folder filter drawer from the bottom

5. **Select folders** in the tree view:
   - Click checkboxes to select folders
   - Parent selection automatically includes all children
   - Expand/collapse folders using the arrow icons
   - See document counts next to each folder

6. **Click "Apply Filters"** to filter the documents

7. **Verify filtering works:**
   - Only documents from selected folders should appear
   - Badge shows number of selected folders
   - "Clear Filter" button removes all filters

## Folder Structure Overview

The CSV contained **1,041 unique folders** organized in a hierarchy. Here are some examples:

**Top-Level Folders:**
- `00_LRH Photos`
- `1_Green Management Volumes`
- `2_OEC Vols`
- `3_RED Technical Volumes`
- `4_BLUE R and D Volumes`
- `5_Key To Life course`
- `Board Technical Bulletins, Bulletins and Policy Letters`
- `Courses-and-Checksheets`
- `Guardians Office`
- `Tape transcripts in order`
- And many more...

**Folder Levels:**
- Level 0: Root folders (e.g., `Books`)
- Level 1: First subfolder (e.g., `Books\Basic Books`)
- Level 2: Second subfolder (e.g., `Books\Basic Books\Dianetics`)
- And so on...

## Troubleshooting

### Issue: Folders table already exists
**Solution:** Drop the table first:
```sql
DROP TABLE IF EXISTS folders CASCADE;
```
Then re-run script 017.

### Issue: populate_folders.sql takes too long
**Solution:** This is normal. The script inserts 1,041 folders and updates thousands of documents. Wait for completion (usually 30-60 seconds).

### Issue: Filter button doesn't appear
**Possible causes:**
1. Folders table is empty - verify with: `SELECT COUNT(*) FROM folders;`
2. Development server needs restart - restart with `npm run dev`
3. Browser cache - hard refresh with Ctrl+Shift+R

### Issue: No documents appear after filtering
**Possible causes:**
1. Documents aren't linked to folders yet - run script 018 and populate_folders.sql
2. Selected folder has no unclassified documents - try a different folder
3. Check folder_id column exists: `SELECT folder_id FROM documents LIMIT 1;`

## Feature Components

### New Components Created:
- `components/folder-tree.tsx` - Recursive tree view with checkboxes
- `components/folder-filter-drawer.tsx` - Bottom drawer with filter UI

### Modified Components:
- `components/classification-interface.tsx` - Added filter button and filtering logic
- `app/classify/page.tsx` - Fetches folders and document counts

### Database Changes:
- New table: `folders` with parent-child relationships
- Modified table: `documents` with `folder_id` foreign key

## Next Steps

After successful setup:
1. Import your 31,221 documents from the CSV
2. Use the folder filter to organize classification work
3. Filter by specific folders to classify related documents together
4. Combine folder filtering with text search for powerful querying

## Support

If you encounter any issues not covered in troubleshooting:
1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all SQL scripts ran successfully
4. Ensure RLS policies are correct

---

**Setup Complete!** 🎉

You now have a powerful folder-based filtering system for your document classification workflow.

