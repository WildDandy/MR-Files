"""
Delete empty folders (and subfolders) in Google Drive.

Definition of empty: a folder is considered empty if it contains no files
in its entire subtree (i.e., neither directly nor within any descendants).

Safety defaults:
- Dry-run by default: prints which folders would be trashed.
- Moves folders to Trash (not permanent delete). Use --hard-delete to permanently delete.

Prerequisites:
1) Enable Drive API for your Google account:
   - https://console.cloud.google.com/apis/library/drive.googleapis.com
2) Create OAuth client credentials (Desktop app) and download credentials.json
   - Save it next to this script as credentials.json
3) Install dependencies:
   - pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

Usage examples:
  Dry run all My Drive:
    python delete_empty_drive_folders.py

  Dry run starting at a specific folder:
    python delete_empty_drive_folders.py --root <FOLDER_ID>

  Actually move to Trash:
    python delete_empty_drive_folders.py --delete

  Permanently delete (USE WITH CARE):
    python delete_empty_drive_folders.py --delete --hard-delete

Notes:
- For Shared Drives, provide --drive-id <DRIVE_ID>. The script handles both My Drive and Shared Drives.
- You must have permission to trash/delete the target folders.
"""

from __future__ import annotations
import argparse
import os
import sys
from typing import Dict, List, Tuple

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/drive"]
FOLDER_MIME = "application/vnd.google-apps.folder"


def get_service():
    creds = None
    token_path = "token.json"
    credentials_path = "credentials.json"

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                print("Missing credentials.json. See script header for setup.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "w") as token:
            token.write(creds.to_json())
    return build("drive", "v3", credentials=creds)


def list_children(service, folder_id: str, drive_id: str | None = None) -> List[Dict]:
    """List direct children (files + folders) of a folder, excluding trashed."""
    items: List[Dict] = []
    page_token = None

    params = {
        "q": f"'{folder_id}' in parents and trashed = false",
        "fields": "nextPageToken, files(id, name, mimeType)",
        "pageSize": 1000,
        "supportsAllDrives": True,
        "includeItemsFromAllDrives": True,
    }
    if drive_id:
        params.update({"corpora": "drive", "driveId": drive_id})
    else:
        params.update({"corpora": "user"})

    while True:
        if page_token:
            params["pageToken"] = page_token
        resp = service.files().list(**params).execute()
        items.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return items


def prune_folder(
    service,
    folder_id: str,
    drive_id: str | None,
    dry_run: bool,
    hard_delete: bool,
    path_hint: str = "",
) -> Tuple[bool, int]:
    """
    Recursively determine if a folder subtree has any files. If none, trash/delete folders.

    Returns (is_empty, deleted_count).
    """
    children = list_children(service, folder_id, drive_id)
    # Separate files and folders
    files = [c for c in children if c.get("mimeType") != FOLDER_MIME]
    subfolders = [c for c in children if c.get("mimeType") == FOLDER_MIME]

    deleted_count = 0
    any_nonempty_child = False

    # Process subfolders first (post-order)
    for sub in subfolders:
        sub_path_hint = f"{path_hint}/{sub.get('name')}" if path_hint else sub.get("name", "")
        sub_empty, sub_deleted = prune_folder(service, sub["id"], drive_id, dry_run, hard_delete, sub_path_hint)
        deleted_count += sub_deleted
        if sub_empty:
            # Child is empty: trash/delete it
            if dry_run:
                print(f"DRY-RUN: Would trash empty folder: {sub_path_hint} ({sub['id']})")
            else:
                try:
                    if hard_delete:
                        service.files().delete(fileId=sub["id"]).execute()
                        print(f"Deleted empty folder: {sub_path_hint} ({sub['id']})")
                    else:
                        service.files().update(fileId=sub["id"], body={"trashed": True}).execute()
                        print(f"Trashed empty folder: {sub_path_hint} ({sub['id']})")
                    deleted_count += 1
                except HttpError as e:
                    print(f"ERROR: Could not remove folder {sub_path_hint} ({sub['id']}): {e}")
        else:
            any_nonempty_child = True

    # Determine if current folder is empty by subtree definition
    has_files_here = len(files) > 0
    is_empty = (not has_files_here) and (not any_nonempty_child)

    return is_empty, deleted_count


def main():
    parser = argparse.ArgumentParser(description="Delete empty folders in Google Drive")
    parser.add_argument("--root", default="root", help="Root folder ID to start from (default: My Drive root)")
    parser.add_argument("--drive-id", default=None, help="Shared Drive ID (optional). If provided, scans that drive.")
    parser.add_argument("--delete", action="store_true", help="Actually move folders to Trash (default is dry-run)")
    parser.add_argument(
        "--hard-delete",
        action="store_true",
        help="Permanently delete empty folders (USE WITH CAUTION). Implies --delete",
    )

    args = parser.parse_args()
    dry_run = not args.delete and not args.hard_delete

    try:
        service = get_service()
        print("Scanning folders... This may take a while for large drives.")
        # We do not trash the root itself, only its empty descendants.
        is_empty, deleted_count = prune_folder(
            service,
            args.root,
            args.drive_id,
            dry_run=dry_run,
            hard_delete=args.hard_delete,
            path_hint="",
        )
        if is_empty and args.root != "root":
            # If a custom root is empty, offer to trash/delete it as well
            if dry_run:
                print(f"DRY-RUN: Root folder is empty and would be removed: {args.root}")
            else:
                try:
                    if args.hard_delete:
                        service.files().delete(fileId=args.root).execute()
                        print(f"Deleted empty root folder: {args.root}")
                    else:
                        service.files().update(fileId=args.root, body={"trashed": True}).execute()
                        print(f"Trashed empty root folder: {args.root}")
                    deleted_count += 1
                except HttpError as e:
                    print(f"ERROR: Could not remove root folder {args.root}: {e}")

        print("\nSummary:")
        if dry_run:
            print("Dry-run complete. No folders were removed.")
        print(f"Folders removed: {deleted_count}")
    except HttpError as e:
        print(f"Drive API error: {e}")
    except KeyboardInterrupt:
        print("Interrupted.")


if __name__ == "__main__":
    main()