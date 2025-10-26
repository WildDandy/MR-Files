#!/usr/bin/env python3
"""
Add File URLs to CSV
Generates file:// URLs for local Google Drive files
"""

import csv
import os
import urllib.parse

CSV_INPUT = "google_drive_documents.csv"
CSV_OUTPUT = "google_drive_documents_with_urls.csv"
DRIVE_ROOT = r"G:\My Drive\scientology\LRH-site"

def generate_csv_with_urls(input_csv, output_csv):
    print(f"[INFO] Reading {input_csv}")
    
    with open(input_csv, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        rows = list(reader)
    
    print(f"[INFO] Processing {len(rows)} documents")
    
    # Add file_url column
    for row in rows:
        path = row['Path']
        
        # Build full local path
        full_path = os.path.join(DRIVE_ROOT, path)
        
        # Convert to file:// URL (with proper encoding)
        file_url = "file:///" + full_path.replace("\\", "/")
        
        row['File URL'] = file_url
    
    # Write new CSV
    fieldnames = ['Document Name', 'Location', 'Path', 'File URL']
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"[SUCCESS] Created {output_csv}")
    print(f"[INFO] Now contains file:// URLs for local files")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, CSV_INPUT)
    output_path = os.path.join(script_dir, CSV_OUTPUT)
    
    if os.path.exists(input_path):
        generate_csv_with_urls(input_path, output_path)
        print(f"\n[NEXT] Import {CSV_OUTPUT} instead of the old CSV")
    else:
        print(f"[ERROR] CSV not found: {input_path}")

