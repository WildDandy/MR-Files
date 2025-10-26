#!/usr/bin/env python3
"""
Direct SQL Import Script
Generates SQL INSERT statements from CSV for direct Supabase import
This bypasses the web UI completely
"""

import csv
import os
import uuid

CSV_FILE = "google_drive_documents.csv"
OUTPUT_SQL = "import_documents_direct.sql"
LOCATION_UUID = "ea3bd0c5-b7cf-42be-9dfa-7002d75fc8cd"

def get_file_type(filename):
    """Get file type from extension"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    type_map = {
        'pdf': 'PDF',
        'doc': 'Word', 'docx': 'Word',
        'xls': 'Excel', 'xlsx': 'Excel',
        'txt': 'Text',
        'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image',
        'mp4': 'Video',
        'zip': 'Archive', 'rar': 'Archive',
    }
    return type_map.get(ext, 'Other')

def generate_import_sql(csv_path, output_path):
    print(f"[INFO] Reading CSV: {csv_path}")
    
    documents = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            doc_name = row['Document Name'].strip()
            location = row['Location'].strip()
            path = row['Path'].strip()
            
            documents.append({
                'id': str(uuid.uuid4()),
                'title': doc_name,
                'location': location,
                'path': path,
                'file_type': get_file_type(doc_name)
            })
    
    print(f"[SUCCESS] Parsed {len(documents)} documents")
    
    # Write SQL
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("-- Direct SQL Import for Documents\n")
        f.write("-- This bypasses the web UI and imports directly\n\n")
        f.write("BEGIN;\n\n")
        
        # Write in batches of 500
        batch_size = 500
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(documents) + batch_size - 1) // batch_size
            
            f.write(f"-- Batch {batch_num} of {total_batches}\n")
            f.write("INSERT INTO documents (id, title, file_url, file_type, status, location, path) VALUES\n")
            
            values = []
            for doc in batch:
                title_esc = doc['title'].replace("'", "''")
                path_esc = doc['path'].replace("'", "''")
                location_esc = doc['location'].replace("'", "''")
                file_type_esc = doc['file_type'].replace("'", "''")
                
                values.append(
                    f"  ('{doc['id']}', '{title_esc}', '', '{file_type_esc}', 'unclassified', '{location_esc}', '{path_esc}')"
                )
            
            f.write(",\n".join(values))
            f.write(";\n\n")
        
        f.write("COMMIT;\n\n")
        f.write("-- Verify import\n")
        f.write("SELECT COUNT(*) as total_docs FROM documents;\n")
        f.write("SELECT COUNT(*) FILTER (WHERE path LIKE '%\\\\%') as docs_with_folder_paths FROM documents;\n")
    
    print(f"[SUCCESS] SQL file created: {output_path}")
    print(f"[INFO] This file is too large for Supabase SQL Editor")
    print(f"[INFO] But it shows the proper import format")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, CSV_FILE)
    output_path = os.path.join(script_dir, OUTPUT_SQL)
    
    if os.path.exists(csv_path):
        generate_import_sql(csv_path, output_path)
    else:
        print(f"[ERROR] CSV not found: {csv_path}")

