"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface FolderNode {
  id: string
  name: string
  full_path: string
  level: number
  parent_id: string | null
  children?: FolderNode[]
  documentCount?: number
}

interface FolderTreeProps {
  folders: FolderNode[]
  selectedFolderIds: string[]
  onSelectionChange: (folderIds: string[]) => void
  documentCounts?: Record<string, number>
}

interface FolderTreeNodeProps {
  node: FolderNode
  selectedIds: Set<string>
  onToggle: (folderId: string, isSelected: boolean) => void
  documentCount: number
  level: number
}

function FolderTreeNode({ node, selectedIds, onToggle, documentCount, level }: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const isSelected = selectedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  const handleCheckboxChange = (checked: boolean) => {
    onToggle(node.id, checked)
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
          isSelected && "bg-muted"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggleExpand}
          className={cn(
            "h-5 w-5 flex items-center justify-center rounded hover:bg-muted-foreground/10 transition-colors",
            !hasChildren && "invisible"
          )}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {hasChildren &&
            (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </button>

        {/* Checkbox */}
        <Checkbox
          id={`folder-${node.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="border border-black"
        />

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
        )}

        {/* Folder Name and Count */}
        <label
          htmlFor={`folder-${node.id}`}
          className="flex-1 cursor-pointer flex items-center justify-between gap-2 min-w-0"
        >
          <span className="text-sm truncate" title={node.name}>
            {node.name}
          </span>
          {documentCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
              {documentCount}
            </span>
          )}
        </label>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children?.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              documentCount={child.documentCount || 0}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({ folders, selectedFolderIds, onSelectionChange, documentCounts = {} }: FolderTreeProps) {
  const selectedIds = useMemo(() => new Set(selectedFolderIds), [selectedFolderIds])

  // Build hierarchical structure with optimized single-pass algorithm
  const { folderTree, descendantMap } = useMemo(() => {
    const folderMap = new Map<string, FolderNode>()
    const childrenByParent = new Map<string | null, FolderNode[]>()

    // Single pass: create all nodes and build parent map
    folders.forEach((folder) => {
      const node: FolderNode = {
        id: folder.id,
        name: folder.name,
        full_path: folder.full_path,
        level: folder.level,
        parent_id: folder.parent_id,
        children: [],
        documentCount: documentCounts[folder.id] || 0,
      }
      folderMap.set(folder.id, node)

      // Add to parent's children
      if (!childrenByParent.has(folder.parent_id)) {
        childrenByParent.set(folder.parent_id, [])
      }
      childrenByParent.get(folder.parent_id)!.push(node)
    })

    // Attach children to parents and sort
    const sortChildren = (node: FolderNode) => {
      const children = childrenByParent.get(node.id) || []
      node.children = children.sort((a, b) => a.name.localeCompare(b.name))
      node.children.forEach(sortChildren)
    }

    // Root nodes
    const rootNodes = (childrenByParent.get(null) || []).sort((a, b) => a.name.localeCompare(b.name))
    rootNodes.forEach(sortChildren)

    // Build descendant map for O(1) lookups during selection
    const descMap = new Map<string, Set<string>>()
    const computeDescendants = (folderId: string): Set<string> => {
      if (descMap.has(folderId)) return descMap.get(folderId)!

      const descendants = new Set<string>()
      const node = folderMap.get(folderId)
      if (node && node.children) {
        node.children.forEach((child) => {
          descendants.add(child.id)
          computeDescendants(child.id).forEach((desc) => descendants.add(desc))
        })
      }
      descMap.set(folderId, descendants)
      return descendants
    }

    folders.forEach((f) => computeDescendants(f.id))

    return { folderTree: rootNodes, descendantMap: descMap }
  }, [folders, documentCounts])

  // Memoized toggle handler with efficient descendant lookup
  const handleToggle = useCallback(
    (folderId: string, isSelected: boolean) => {
      const newSelection = new Set(selectedIds)
      const descendants = descendantMap.get(folderId) || new Set<string>()

      if (isSelected) {
        newSelection.add(folderId)
        descendants.forEach((id) => newSelection.add(id))
      } else {
        newSelection.delete(folderId)
        descendants.forEach((id) => newSelection.delete(id))
      }

      onSelectionChange(Array.from(newSelection))
    },
    [selectedIds, descendantMap, onSelectionChange],
  )

  if (folderTree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No folders found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[50vh]">
      <div className="space-y-0.5 pr-4">
        {folderTree.map((node) => (
          <FolderTreeNode
            key={node.id}
            node={node}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            documentCount={node.documentCount || 0}
            level={0}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

