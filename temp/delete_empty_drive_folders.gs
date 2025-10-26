/**
 * Google Apps Script to trash folders (and subfolders) that have zero documents in their subtree.
 *
 * Definition of empty: no files in the folder or any of its descendants.
 * Safety: moves to Trash; you can restore from Trash if needed.
 *
 * How to use:
 * 1) Open https://script.google.com and create a new project.
 * 2) Paste this script and save.
 * 3) Run deleteEmptyFoldersMyDrive() for My Drive root, or deleteEmptyFoldersFrom('<FOLDER_ID>') to start deeper.
 * 4) The script will prompt for authorization the first time.
 *
 * Optional: If you want permanent delete, enable Advanced Google Services (Drive API) and replace setTrashed(true)
 *           with Drive.Files.remove(folder.getId()), but BE CAREFUL.
 */

/** Returns true if the folder subtree has no files. Trashes empty child folders on the way up. */
function pruneAndTrash(folder, isRoot) {
  // Check direct files in this folder
  var hasFilesHere = folder.getFiles().hasNext();

  // Post-order traversal of subfolders
  var subFolders = folder.getFolders();
  var allChildrenEmpty = true;
  var trashedCount = 0;

  while (subFolders.hasNext()) {
    var sub = subFolders.next();
    var childEmpty = pruneAndTrash(sub, false);
    if (childEmpty) {
      // Trash the empty child folder
      sub.setTrashed(true);
      trashedCount++;
      Logger.log('Trashed empty folder: ' + sub.getName() + ' (' + sub.getId() + ')');
    } else {
      allChildrenEmpty = false;
    }
  }

  var isEmpty = !hasFilesHere && allChildrenEmpty;

  // Do not trash the root folder itself
  if (!isRoot && isEmpty) {
    // Let caller trash this after return; here we only signal emptiness
  }

  return isEmpty;
}

/** Trash all empty folders under My Drive root. */
function deleteEmptyFoldersMyDrive() {
  var root = DriveApp.getRootFolder();
  var wasEmpty = pruneAndTrash(root, true);
  Logger.log('Finished. Root empty: ' + wasEmpty);
}

/** Trash all empty folders under the provided folder ID. The folder itself is not trashed. */
function deleteEmptyFoldersFrom(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var wasEmpty = pruneAndTrash(folder, true);
  Logger.log('Finished. Starting folder empty: ' + wasEmpty);
}