#!/usr/bin/env python3
"""
Update Document Paths Script
Updates the path column in existing documents based on the CSV file
"""

import csv
import os

# Configuration
CSV_FILE = "google_drive_documents.csv"
OUTPUT_SQL = "update_document_paths.sql"

def generate_path_update_sql(csv_path: str, output_path: str):
    """
    Generate SQL to update document paths based on CSV
    """
    print(f"[INFO] Reading CSV: {csv_path}")
    
    updates = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            doc_name = row.get('Document Name', '').strip()
            path = row.get('Path', '').strip()
            
            if doc_name and path and doc_name != path:
                # Escape single quotes for SQL
                doc_name_escaped = doc_name.replace("'", "''")
                path_escaped = path.replace("'", "''")
                
                updates.append((doc_name_escaped, path_escaped))
    
    print(f"[SUCCESS] Found {len(updates)} documents with folder paths to update")
    
    # Write SQL
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("-- Update document paths from CSV\n")
        f.write("-- This fixes documents where path = title (should be full folder path)\n\n")
        f.write("BEGIN;\n\n")
        
        f.write(f"-- Updating {len(updates)} document paths\n\n")
        
        # Write updates in batches for better performance
        batch_size = 100
        for i in range(0, len(updates), batch_size):
            batch = updates[i:i+batch_size]
            
            f.write(f"-- Batch {i//batch_size + 1}\n")
            for doc_name, path in batch:
                f.write(f"UPDATE documents SET path = '{path}' WHERE title = '{doc_name}';\n")
            f.write("\n")
        
        f.write("COMMIT;\n\n")
        f.write("-- Verify updates\n")
        f.write("SELECT \n")
        f.write("  COUNT(*) FILTER (WHERE path = title) as paths_equal_title,\n")
        f.write("  COUNT(*) FILTER (WHERE path LIKE '%\\\\%') as paths_with_folders,\n")
        f.write("  COUNT(*) as total_documents\n")
        f.write("FROM documents;\n")
    
    print(f"[SUCCESS] SQL file created: {output_path}")
    print(f"[INFO] Run this file in Supabase SQL Editor to update paths")

def main():
    print("=" * 60)
    print("  Update Document Paths Script")
    print("=" * 60)
    print()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, CSV_FILE)
    output_path = os.path.join(script_dir, OUTPUT_SQL)
    
    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV file not found: {csv_path}")
        return
    
    generate_path_update_sql(csv_path, output_path)
    
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Run temp/update_document_paths.sql in Supabase SQL Editor")
    print("2. Wait for update to complete (~30 seconds for 31,221 documents)")
    print("3. Run temp/populate_folders.sql to link documents to folders")
    print("4. Refresh your classify page and test the folder filter")
    print("=" * 60)

if __name__ == "__main__":
    main()

