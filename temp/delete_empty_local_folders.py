"""
Delete empty folders in a local Google Drive sync path (Windows).

Definition of empty: a folder is considered empty if it contains no files
in its entire subtree. The script first deletes empty child folders,
then deletes the parent if no files remain.

Safety:
- Dry-run by default (prints what would be deleted).
- Use --delete to actually remove empty folders.
- Use --dry-run to explicitly run in preview mode.
- By default, the root folder is NOT deleted even if empty.

Example:
  python delete_empty_local_folders.py --root "G:\\My Drive\\scientology"
  python delete_empty_local_folders.py --root "G:\\My Drive\\scientology" --dry-run
  python delete_empty_local_folders.py --root "G:\\My Drive\\scientology" --delete

Notes:
- This works with Google Drive for desktop because deletions in the sync
  folder are propagated to Drive.
- Ignores common system files (desktop.ini, Thumbs.db) by default.
"""

from __future__ import annotations
import argparse
import os
import shutil
from typing import Set

DEFAULT_IGNORE_NAMES: Set[str] = {"desktop.ini", "Thumbs.db"}


def prune_folder(path: str, dry_run: bool, ignore_names: Set[str]) -> bool:
    """Recursively delete empty subfolders and return True if this folder becomes empty.

    Empty means no files anywhere under it after pruning its children.
    """
    # Process subfolders first (post-order)
    try:
        with os.scandir(path) as it:
            subdirs = [entry for entry in it if entry.is_dir(follow_symlinks=False)]
    except FileNotFoundError:
        return True
    except PermissionError:
        print(f"WARN: Permission denied: {path}")
        subdirs = []

    for sub in subdirs:
        sub_empty = prune_folder(sub.path, dry_run, ignore_names)
        if sub_empty:
            if dry_run:
                print(f"DRY-RUN: Would remove empty folder: {sub.path}")
            else:
                try:
                    os.rmdir(sub.path)
                    print(f"Removed empty folder: {sub.path}")
                except OSError:
                    # If non-deletable due to ignorable files, force remove the directory tree
                    try:
                        shutil.rmtree(sub.path)
                        print(f"Removed empty folder: {sub.path}")
                    except Exception as e:
                        print(f"WARN: Could not remove folder: {sub.path} ({e})")

    # After pruning children, check for files anywhere under this folder
    has_files = False
    try:
        for root, dirs, files in os.walk(path):
            # If any file remains, considering ignore list, the folder is not empty
            for f in files:
                if f in ignore_names:
                    continue
                has_files = True
                break
            if has_files:
                break
    except PermissionError:
        print(f"WARN: Permission denied while walking: {path}")
        has_files = True

    is_empty = not has_files
    return is_empty


def main():
    parser = argparse.ArgumentParser(description="Delete empty local folders in Google Drive sync path")
    parser.add_argument("--root", required=True, help="Root directory to prune (e.g., G:\\My Drive\\scientology)")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode: print what would be deleted")
    parser.add_argument("--delete", action="store_true", help="Actually remove empty folders")
    parser.add_argument("--ignore", nargs="*", default=list(DEFAULT_IGNORE_NAMES), help="File names to ignore")

    args = parser.parse_args()

    if args.delete and args.dry_run:
        print("ERROR: Use either --delete or --dry-run, not both.")
        return

    ignore_names = set(args.ignore)
    dry_run = args.dry_run or (not args.delete)

    if not os.path.isdir(args.root):
        print(f"ERROR: Root directory not found: {args.root}")
        return

    print(f"Scanning: {args.root}")
    print("Mode: " + ("DRY-RUN" if dry_run else "DELETE"))

    root_empty = prune_folder(args.root, dry_run=dry_run, ignore_names=ignore_names)

    # Do not delete the root itself; just report
    if root_empty:
        print("Root is empty after pruning child folders.")
    print("Done.")


if __name__ == "__main__":
    main()