<!-- 40107a7a-b7cb-4d99-8d84-4dea74283142 4bef3b83-211d-4425-ae43-5df8ed73587d -->
# Setup Document Classification Project with Supabase and GitHub

## 1. Install Supabase CLI

Install Supabase CLI globally using npm to enable database operations from the command line.

## 2. Configure Environment Variables

Create two files:

**`.env.local`** (actual credentials):

```
NEXT_PUBLIC_SUPABASE_URL=https://ocajcjdlrmbmfiirxndn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jYWpjamRscm1ibWZpaXJ4bmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDczMzEsImV4cCI6MjA3Njk4MzMzMX0.rIZ7sWMeFOSyc-PGu_OyhDziF1F3FStSzJanh_uVgLw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jYWpjamRscm1ibWZpaXJ4bmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwNzMzMSwiZXhwIjoyMDc2OTgzMzMxfQ.nGnbBJprPm2dk07Yis_UWTzZ2Fnzl-R6Wu3T6iPrIi8
```

**`.env.example`** (template for safety):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Execute Database Migrations

Run all 16 SQL scripts in sequential order on Supabase instance using Supabase CLI:

- `001_create_tables.sql` - Creates organizational hierarchy and documents tables
- `002_enable_rls.sql` - Enables Row Level Security
- `003_seed_organizational_structure.sql` - Seeds initial data
- `004_update_documents_for_bulk_import.sql` - Updates documents schema
- `005_add_location_and_access_fields.sql` - Adds location/access fields
- `006_add_group_name_column.sql` - Adds group name column
- `007_create_document_types_table.sql` - Creates document types table
- `008_add_division_colors_and_update_structure.sql` - Adds colors
- `009_add_priority_field.sql` - Adds priority field
- `010_restore_correct_departments.sql` - Restores departments
- `011_restore_actual_divisions.sql` - Restores divisions
- `012_empty_documents_table.sql` - Clears documents
- `013_fix_document_update_permissions.sql` - Fixes permissions
- `014_fix_admin_table_permissions.sql` - Fixes admin permissions
- `015_create_locations_table.sql` - Creates locations table
- `016_add_path_to_documents.sql` - Adds path field

Each script will be executed using: `supabase db push --file scripts/XXX_script_name.sql`

## 4. Initialize Git Repository

- Create `.gitignore` to exclude `.env.local`, `node_modules`, `.next`, etc.
- Initialize git repository
- Add all files to staging
- Create initial commit

## 5. Push to GitHub

- Add remote origin: `https://github.com/WildDandy/MR-Files.git`
- Push to main branch

## 6. Verify Application

- Restart the development server
- Verify no Supabase connection errors
- Confirm the application loads at `http://localhost:3000`

## Key Files Modified/Created

- `.env.local` (new)
- `.env.example` (new)
- `.gitignore` (new)
- All files committed to git repository

### To-dos

- [ ] Install Supabase CLI globally
- [ ] Create .env.local and .env.example files with Supabase credentials
- [ ] Execute all 16 SQL scripts in order on Supabase instance
- [ ] Initialize git repository, create .gitignore, and commit all files
- [ ] Add GitHub remote and push to repository
- [ ] Restart dev server and verify application runs without errors