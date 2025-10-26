const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migrations = [
  '017_create_folders_table.sql',
  '018_add_folder_id_to_documents.sql',
  '019_add_core_indexes.sql',
  '020_enable_trgm_and_add_text_indexes.sql',
  '021_add_ltree_optimization.sql',
  '022_create_folder_counts_view.sql',
  '023_add_folder_count_refresh_trigger.sql'
];

async function runMigrations() {
  console.log('Starting migrations...\n');
  
  for (const migration of migrations) {
    const filePath = path.join(__dirname, 'scripts', migration);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Running: ${migration}`);
      
      const { error } = await supabase.rpc('exec', { sql_string: sql });
      
      if (error) {
        // Try direct SQL execution via connection
        console.log(`Using direct SQL execution for ${migration}...`);
        const { error: directError } = await supabase.functions.invoke('exec_sql', {
          body: { sql }
        });
        
        if (directError) {
          console.error(`Error running ${migration}:`, directError);
        } else {
          console.log(`✓ ${migration} completed\n`);
        }
      } else {
        console.log(`✓ ${migration} completed\n`);
      }
    } catch (err) {
      console.error(`Error reading ${migration}:`, err.message);
    }
  }
  
  console.log('Migrations completed!');
}

runMigrations().catch(console.error);
