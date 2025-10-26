#!/usr/bin/env python3
"""
Google Drive Directory Crawler
Crawls all directories and subdirectories to create a CSV for bulk document import.
"""

import os
import csv
from pathlib import Path

# Configuration
SOURCE_DIRECTORY = r"G:\My Drive\scientology\LRH-site"
OUTPUT_CSV = "google_drive_documents.csv"
LOCATION_UUID = "ea3bd0c5-b7cf-42be-9dfa-7002d75fc8cd"  # Google Drive location UUID

def crawl_directory(root_path: str) -> list[dict]:
    """
    Crawl directory and collect all files with their metadata.
    
    Args:
        root_path: Root directory to start crawling from
        
    Returns:
        List of dictionaries containing document information
    """
    documents = []
    
    # Check if directory exists
    if not os.path.exists(root_path):
        print(f"[ERROR] Directory not found: {root_path}")
        return documents
    
    print(f"[INFO] Crawling directory: {root_path}")
    print(f"[INFO] Please wait, this may take a while...\n")
    
    file_count = 0
    dir_count = 0
    
    # Walk through all directories and subdirectories
    for root, dirs, files in os.walk(root_path):
        dir_count += len(dirs)
        
        for filename in files:
            # Full path to the file
            full_path = os.path.join(root, filename)
            
            # Convert to relative path from the root directory
            relative_path = os.path.relpath(full_path, root_path)
            
            # Add document to list
            documents.append({
                'Document Name': filename,
                'Location': LOCATION_UUID,
                'Path': relative_path
            })
            
            file_count += 1
            
            # Progress indicator every 100 files
            if file_count % 100 == 0:
                print(f"   Processed {file_count} files...")
    
    print(f"\n[SUCCESS] Crawl complete!")
    print(f"   Files found: {file_count}")
    print(f"   Directories scanned: {dir_count}")
    
    return documents

def write_csv(documents: list[dict], output_file: str):
    """
    Write documents list to CSV file.
    
    Args:
        documents: List of document dictionaries
        output_file: Output CSV filename
    """
    if not documents:
        print("[WARNING] No documents to write to CSV")
        return
    
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, output_file)
    
    try:
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Document Name', 'Location', 'Path']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            writer.writerows(documents)
        
        print(f"\n[SUCCESS] CSV file created successfully!")
        print(f"   Location: {output_path}")
        print(f"   Total documents: {len(documents)}")
        
    except Exception as e:
        print(f"\n[ERROR] Error writing CSV file: {e}")

def main():
    """Main execution function."""
    print("=" * 60)
    print("  Google Drive Directory Crawler")
    print("  Document Classification System")
    print("=" * 60)
    print()
    
    # Crawl the directory
    documents = crawl_directory(SOURCE_DIRECTORY)
    
    if documents:
        # Write to CSV
        write_csv(documents, OUTPUT_CSV)
        print("\n[COMPLETE] Process complete! You can now use the CSV for bulk import.")
    else:
        print("\n[WARNING] No documents found. Please check the directory path.")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()

