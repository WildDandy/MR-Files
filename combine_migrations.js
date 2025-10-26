const fs = require('fs');
const path = require('path');

const migrations = [
  '017_create_folders_table.sql',
  '018_add_folder_id_to_documents.sql',
  '019_add_core_indexes.sql',
  '020_enable_trgm_and_add_text_indexes.sql',
  '021_add_ltree_optimization.sql',
  '022_create_folder_counts_view.sql',
  '023_add_folder_count_refresh_trigger.sql'
];

let combined = '';

for (const migration of migrations) {
  const filePath = path.join(__dirname, 'scripts', migration);
  const sql = fs.readFileSync(filePath, 'utf-8');
  combined += `-- ========================================\n`;
  combined += `-- ${migration}\n`;
  combined += `-- ========================================\n\n`;
  combined += sql + '\n\n';
}

fs.writeFileSync(path.join(__dirname, 'run_migrations_combined.sql'), combined);
console.log('Combined migration file created: run_migrations_combined.sql');
