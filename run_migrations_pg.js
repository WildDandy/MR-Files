const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project reference from URL (ocajcjdlrmbmfiirxndn from https://ocajcjdlrmbmfiirxndn.supabase.co)
const projectRef = supabaseUrl.split('https://')[1].split('.supabase.co')[0];

// Construct PostgreSQL connection string
const connectionString = `postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

console.log('To run these migrations, you have two options:\n');
console.log('Option 1: Use Supabase Studio (Web UI)');
console.log('1. Go to https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Create a new query and paste the SQL from scripts/017-023\n');

console.log('Option 2: Use psql command line');
console.log(`psql '${connectionString}'`);
console.log('Then paste the SQL from each migration file.\n');

const migrations = [
  '017_create_folders_table.sql',
  '018_add_folder_id_to_documents.sql',
  '019_add_core_indexes.sql',
  '020_enable_trgm_and_add_text_indexes.sql',
  '021_add_ltree_optimization.sql',
  '022_create_folder_counts_view.sql',
  '023_add_folder_count_refresh_trigger.sql'
];

console.log('Creating combined migration file...\n');

let combinedSQL = '';
for (const migration of migrations) {
  const filePath = path.join(__dirname, 'scripts', migration);
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    combinedSQL += `\n-- ========================================\n`;
    combinedSQL += `-- ${migration}\n`;
    combinedSQL += `-- ========================================\n`;
    combinedSQL += sql + '\n';
  } catch (err) {
    console.error(`Error reading ${migration}:`, err.message);
  }
}

// Write combined SQL to a file
const outputPath = path.join(__dirname, 'run_migrations_combined.sql');
fs.writeFileSync(outputPath, combinedSQL);
console.log(`✓ Combined migration file created: ${outputPath}\n`);
console.log('You can now:');
console.log(`1. Copy the content from: ${outputPath}`);
console.log('2. Paste it into Supabase Studio SQL Editor');
console.log('3. Click "Run" to execute all migrations\n');

console.log('Migration files included:');
migrations.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
