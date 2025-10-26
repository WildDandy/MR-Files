"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { debounce } from "@/lib/debounce"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { FolderTree, type FolderNode } from "@/components/folder-tree"
import { XSquare, Filter } from "lucide-react"

interface FolderFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderNode[]
  selectedFolderIds: string[]
  onApplyFilters: (folderIds: string[]) => void
  documentCounts?: Record<string, number>
}

export function FolderFilterDrawer({
  open,
  onOpenChange,
  folders,
  selectedFolderIds,
  onApplyFilters,
  documentCounts = {},
}: FolderFilterDrawerProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedFolderIds)

  // Sync temp selection with prop changes
  useEffect(() => {
    setTempSelectedIds(selectedFolderIds)
  }, [selectedFolderIds])

  const handleApply = () => {
    onApplyFilters(tempSelectedIds)
    onOpenChange(false)
  }

  const handleClearAll = () => {
    setTempSelectedIds([])
  }

  const handleCancel = () => {
    // Reset to original selection
    setTempSelectedIds(selectedFolderIds)
    onOpenChange(false)
  }

  const selectedCount = tempSelectedIds.length
  const totalDocuments = tempSelectedIds.reduce((sum, folderId) => {
    return sum + (documentCounts[folderId] || 0)
  }, 0)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter by Folder
              </DrawerTitle>
              <DrawerDescription>
                Select folders to filter documents. Child folders are automatically included when parent is selected.
              </DrawerDescription>
            </div>
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="bg-yellow-400 hover:bg-yellow-500 border border-black"
              >
                <XSquare className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="p-4">
          {selectedCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">{selectedCount}</span> folder{selectedCount !== 1 ? "s" : ""} selected
                {totalDocuments > 0 && (
                  <>
                    {" "}
                    · <span className="font-semibold">{totalDocuments}</span> document{totalDocuments !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          )}

          <FolderTree
            folders={folders}
            selectedFolderIds={tempSelectedIds}
            onSelectionChange={setTempSelectedIds}
            documentCounts={documentCounts}
          />
        </div>

        <DrawerFooter className="border-t flex-row gap-2">
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 border border-black text-black"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </DrawerClose>
          <Button
            onClick={handleApply}
            disabled={selectedCount === 0}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 border border-black text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Filters {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

