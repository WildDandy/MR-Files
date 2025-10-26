# Database Migration Guide

## Overview
This document contains instructions for executing the 16 SQL migration scripts on your Supabase instance.

## Prerequisites
- Supabase account with access to the project: `ocajcjdlrmbmfiirxndn`
- Project URL: `https://ocajcjdlrmbmfiirxndn.supabase.co`

## Migration Scripts
All scripts are located in the `scripts/` directory and must be executed **in sequential order**.

## Option 1: Using Supabase Dashboard (Recommended)

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ocajcjdlrmbmfiirxndn
   - Login with your credentials

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute Each Script in Order**
   For each script (001 through 016):
   - Open the script file from `scripts/` directory
   - Copy the entire SQL content
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for confirmation before proceeding to the next script

### Script Execution Order:

1. `001_create_tables.sql` - Creates organizational hierarchy and documents tables
2. `002_enable_rls.sql` - Enables Row Level Security
3. `003_seed_organizational_structure.sql` - Seeds initial data
4. `004_update_documents_for_bulk_import.sql` - Updates documents schema
5. `005_add_location_and_access_fields.sql` - Adds location/access fields
6. `006_add_group_name_column.sql` - Adds group name column
7. `007_create_document_types_table.sql` - Creates document types table
8. `008_add_division_colors_and_update_structure.sql` - Adds colors
9. `009_add_priority_field.sql` - Adds priority field
10. `010_restore_correct_departments.sql` - Restores departments
11. `011_restore_actual_divisions.sql` - Restores divisions
12. `012_empty_documents_table.sql` - Clears documents
13. `013_fix_document_update_permissions.sql` - Fixes permissions
14. `014_fix_admin_table_permissions.sql` - Fixes admin permissions
15. `015_create_locations_table.sql` - Creates locations table
16. `016_add_path_to_documents.sql` - Adds path field

## Option 2: Using psql Command Line

If you have PostgreSQL installed locally:

```bash
# Get your database URL from Supabase Dashboard > Settings > Database
# Connection string format:
# postgresql://postgres:[YOUR-PASSWORD]@db.ocajcjdlrmbmfiirxndn.supabase.co:5432/postgres

# Execute each script
psql "postgresql://postgres:[PASSWORD]@db.ocajcjdlrmbmfiirxndn.supabase.co:5432/postgres" < scripts/001_create_tables.sql
psql "postgresql://postgres:[PASSWORD]@db.ocajcjdlrmbmfiirxndn.supabase.co:5432/postgres" < scripts/002_enable_rls.sql
# ... continue for all scripts
```

## Verification

After running all migrations:

1. **Check Tables**
   - Go to Supabase Dashboard > Table Editor
   - Verify these tables exist:
     - `divisions`
     - `departments`
     - `groups`
     - `document_types`
     - `documents`
     - `locations`
     - `admins`

2. **Check Data**
   - Verify `divisions`, `departments`, and `groups` contain organizational data
   - Verify `document_types` has been populated

3. **Check RLS Policies**
   - Go to Authentication > Policies
   - Verify policies are enabled for relevant tables

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists
- You can skip this specific CREATE TABLE statement
- Or drop the table first and re-run

### Error: "permission denied"
- Make sure you're logged in with the correct account
- Verify you have admin access to the project

### Error: "column already exists"
- The migration may have been partially run
- Check the table structure and skip the duplicate ALTER TABLE commands

## Next Steps

After successful migration:
1. Restart your development server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Test the application features:
   - User authentication
   - Document classification
   - Bulk import
   - Search functionality
   - Admin interface

## Support

If you encounter issues:
1. Check the Supabase logs in Dashboard > Logs
2. Verify your environment variables in `.env.local`
3. Ensure all tables and policies were created successfully

