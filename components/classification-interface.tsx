"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  Check,
  FolderTree,
  X,
  Lock,
  Search,
  Trash2,
  Folder,
  Edit2,
  Plus,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LinkIcon,
  Pencil,
  Filter,
  XSquare,
} from "lucide-react"
import type { Database } from "@/lib/types"
import { FolderFilterDrawer } from "@/components/folder-filter-drawer"
import type { FolderNode } from "@/components/folder-tree"

type Document = Database["public"]["Tables"]["documents"]["Row"]
type ExecutiveDirector = {
  id: string
  name: string
  secretaries: Array<{
    id: string
    name: string
    divisions: Array<{
      id: string
      name: string
      departments: Array<{
        id: string
        name: string
      }>
    }>
  }>
}

interface ClassificationInterfaceProps {
  documents?: Document[]
  organizationalStructure: ExecutiveDirector[]
  folders?: FolderNode[]
  documentCounts?: Record<string, number>
}

type DocumentClassification = {
  divisionId?: string
  divisionName?: string
  divisionColor?: string // Added color to classification
  departmentId?: string
  departmentName?: string
  secretaryId?: string
  executiveDirectorId?: string
  access_level?: string
  priority?: string
}

type ClassifiedDocument = Document & {
  division_name?: string
  department_name?: string
  document_type?: { id: string; name: string }
}

type DocumentType = {
  id: string
  name: string
}

export function ClassificationInterface({
  documents = [],
  organizationalStructure,
  folders = [],
  documentCounts = {},
}: ClassificationInterfaceProps) {
  const [unclassifiedDocs, setUnclassifiedDocs] = useState(documents?.filter((d) => d.status !== "classified") || [])
  const [classifiedDocs, setClassifiedDocs] = useState<ClassifiedDocument[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [classifications, setClassifications] = useState<Record<string, DocumentClassification>>({})
  const [classifying, setClassifying] = useState(false)
  const [selectedClassifiedIds, setSelectedClassifiedIds] = useState<Set<string>>(new Set())
  const [selectedUnclassifiedIds, setSelectedUnclassifiedIds] = useState<Set<string>>(new Set())
  const [selectAllClassifiedMode, setSelectAllClassifiedMode] = useState<"page" | "all">("page")
  const [selectAllUnclassifiedMode, setSelectAllUnclassifiedMode] = useState<"page" | "all">("page")

  // Folder filtering state
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const [isFolderDrawerOpen, setIsFolderDrawerOpen] = useState(false)

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingDocName, setEditingDocName] = useState("")
  const [editingDocTypeId, setEditingDocTypeId] = useState<string | null>(null)
  const [newDocTypeName, setNewDocTypeName] = useState("")
  const [showNewDocTypeInput, setShowNewDocTypeInput] = useState<string | null>(null)

  const [editingUnclassifiedDocId, setEditingUnclassifiedDocId] = useState<string | null>(null)
  const [editingUnclassifiedDocName, setEditingUnclassifiedDocName] = useState("")

  const [editingAccessLevel, setEditingAccessLevel] = useState<string | null>(null)
  const [editingDivision, setEditingDivision] = useState<string | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null)
  const [editingPriority, setEditingPriority] = useState<string | null>(null)

  const [divisionColors, setDivisionColors] = useState<Record<string, string>>({}) // Renamed from divisionColorsMap
  const [divisionColorsMap, setDivisionColorsMap] = useState<Record<string, string>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalUnclassified, setTotalUnclassified] = useState(0)
  const [totalClassified, setTotalClassified] = useState(0)
  const [loading, setLoading] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    current: number
    total: number
    operation: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false) // Added deleting state
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null)

  const [searchQuery, setSearchQuery] = useState("") // Added search query state
  const [sortColumns, setSortColumns] = useState([{ field: "title", direction: "asc" }]) // Added sort columns state
  const [sortField, setSortField] = useState("title") // Added sort field state
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc") // Added sort direction state

  const [activeUnclassifiedTab, setActiveUnclassifiedTab] = useState("classify")

  useEffect(() => {
    fetchClassifiedDocuments()
    fetchDocumentTypes()
    fetchDivisionColors()
    fetchUnclassifiedDocuments()
  }, [currentPage, pageSize, searchQuery, selectedFolderIds])

  const fetchDivisionColors = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("divisions").select("id, name, color")

    if (!error && data) {
      const colorsMap: Record<string, string> = {}
      data.forEach((div) => {
        if (div.name && div.color) {
          colorsMap[div.name] = div.color
        }
      })
      console.log("[v0] Fetched division colors:", colorsMap)
      setDivisionColorsMap(colorsMap)
    }
  }

  const fetchDocumentTypes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("document_types").select("*").order("name")

    if (!error && data) {
      setDocumentTypes(data)
    }
  }

  const fetchUnclassifiedDocuments = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Build query with search filter
      let query = supabase
        .from("documents")
        .select("*", { count: "exact" })
        .eq("status", "unclassified")
        .order("created_at", { ascending: false })

      // Apply search filter on server
      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery.trim()}%`)
      }

      // Apply folder filter: use folder_id index for efficient filtering
      if (selectedFolderIds.length > 0) {
        query = query.in("folder_id", selectedFolderIds)
      }

      // Get total count
      const { count } = await query

      // Fetch paginated results
      const { data, error } = await query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (error) throw error

      setUnclassifiedDocs(data || [])
      setTotalUnclassified(count || 0)
    } catch (error) {
      console.error("Error fetching unclassified documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassifiedDocuments = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      console.log("[v0] Fetching classified documents from database...")

      // Build query with search filter
      let query = supabase
        .from("documents")
        .select(
          `
          *,
          divisions!documents_division_id_fkey(name),
          departments!documents_department_id_fkey(name),
          document_types(id, name)
        `,
          { count: "exact" },
        )
        .eq("status", "classified")
        .order("created_at", { ascending: false })

      // Apply search filter on server
      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery.trim()}%`)
      }

      // Get total count
      const { count } = await query

      // Fetch paginated results
      const { data, error } = await query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (error) throw error

      console.log("[v0] Fetched classified documents:", data?.length, "Total:", count)
      console.log("[v0] First classified doc:", data?.[0]?.title)

      const formattedDocs = (data || []).map((doc: any) => ({
        ...doc,
        division_name: doc.divisions?.name,
        department_name: doc.departments?.name,
        document_type: doc.document_types,
      }))

      setClassifiedDocs(formattedDocs)
      setTotalClassified(count || 0)
    } catch (error) {
      console.error("Error fetching classified documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const allDivisions = organizationalStructure.flatMap((ed) =>
    ed.secretaries.flatMap((sec) =>
      sec.divisions.map((div) => ({
        ...div,
        secretaryId: sec.id,
        executiveDirectorId: ed.id,
      })),
    ),
  )

  const handleDocumentClick = (docId: string) => {
    setSelectedDocId(docId)
  }

  const handleAccessLevelSelect = (accessLevel: string) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    setClassifications((prev) => ({
      ...prev,
      [selectedDocId]: {
        ...prev[selectedDocId],
        access_level: accessLevel,
        divisionId: undefined,
        divisionName: undefined,
        divisionColor: undefined, // Clear color when access level changes
        departmentId: undefined,
        departmentName: undefined,
        location: undefined,
      },
    }))
  }

  const handleDivisionSelect = (
    divisionId: string,
    divisionName: string,
    secretaryId: string,
    executiveDirectorId: string,
  ) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    const classification = classifications[selectedDocId]
    if (!classification?.access_level) {
      alert("Please select access level first")
      return
    }

    const divisionColor = divisionColorsMap[divisionName] || "#CACECF"

    setClassifications((prev) => ({
      ...prev,
      [selectedDocId]: {
        ...prev[selectedDocId],
        divisionId,
        divisionName,
        divisionColor, // Added color
        secretaryId,
        executiveDirectorId,
        departmentId: undefined,
        departmentName: undefined,
        location: undefined,
      },
    }))
  }

  const handleDepartmentSelect = async (departmentId: string, departmentName: string) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    const classification = classifications[selectedDocId]
    if (!classification?.divisionId) {
      alert("Please select access level and division first")
      return
    }

    setClassifications((prev) => ({
      ...prev,
      [selectedDocId]: {
        ...prev[selectedDocId],
        departmentId,
        departmentName,
      },
    }))

    setClassifying(true)
    const supabase = createClient()

    try {
      const selectedDoc = unclassifiedDocs.find((d) => d.id === selectedDocId)
      console.log("[v0] Classifying document:", selectedDoc?.title)

      // Check if user wants to classify the whole group
      const shouldClassifyGroup =
        selectedDoc?.group_name &&
        confirm(
          `This document belongs to group "${selectedDoc.group_name}". Classify all ${unclassifiedDocs.filter((d) => d.group_name === selectedDoc.group_name).length} files in this group?`,
        )

      const docsToClassify =
        shouldClassifyGroup && selectedDoc?.group_name
          ? unclassifiedDocs.filter((d) => d.group_name === selectedDoc.group_name)
          : [selectedDoc].filter(Boolean)

      console.log("[v0] Documents to classify:", docsToClassify.length)

      const updates = docsToClassify.map((doc) => ({
        id: doc!.id,
        executive_director_id: classification.executiveDirectorId,
        secretary_id: classification.secretaryId,
        division_id: classification.divisionId,
        department_id: departmentId,
        access_level: classification.access_level,
        priority: classifications[doc!.id]?.priority || doc?.priority,
        status: "classified",
        classified_at: new Date().toISOString(),
      }))

      console.log("[v0] Update data:", updates[0])

      for (const update of updates) {
        const { error } = await supabase.from("documents").update(update).eq("id", update.id)
        if (error) {
          console.error("[v0] Database update error:", error)
          throw error
        }
        console.log("[v0] Successfully updated document:", update.id)
      }

      const classifiedIds = docsToClassify.map((d) => d!.id)
      setUnclassifiedDocs((prev) => prev.filter((doc) => !classifiedIds.includes(doc.id)))
      setClassifications((prev) => {
        const newClassifications = { ...prev }
        classifiedIds.forEach((id) => delete newClassifications[id])
        return newClassifications
      })
      setSelectedDocId(null)

      console.log("[v0] Fetching classified documents...")
      await fetchClassifiedDocuments()
      await fetchUnclassifiedDocuments()
      console.log("[v0] Classification complete")
    } catch (error) {
      console.error("Error classifying document(s):", error)
      alert("Failed to classify document(s). Please try again.")
    } finally {
      setClassifying(false)
    }
  }


  const handleUnclassify = async (docId: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          executive_director_id: null,
          secretary_id: null,
          division_id: null,
          department_id: null,
          location: null,
          access_level: null,
          priority: null,
          status: "unclassified",
          classified_at: null,
        })
        .eq("id", docId)

      if (error) throw error

      const doc = classifiedDocs.find((d) => d.id === docId)
      if (doc) {
        setUnclassifiedDocs((prev) => [...prev, doc])
        setClassifiedDocs((prev) => prev.filter((d) => d.id !== docId))
        await fetchUnclassifiedDocuments() // Refetch to update counts and potentially pagination
        await fetchClassifiedDocuments()
      }
    } catch (error) {
      console.error("Error unclassifying document:", error)
      alert("Failed to unclassify document. Please try again.")
    }
  }

  const handleUpdateDocumentName = async (docId: string, newName: string) => {
    if (!newName.trim()) {
      alert("Document name cannot be empty")
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").update({ title: newName.trim() }).eq("id", docId)

      if (error) throw error

      setClassifiedDocs((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, title: newName.trim() } : doc)))
      setEditingDocId(null)
      setEditingDocName("")
      await fetchClassifiedDocuments() // Refetch to ensure consistency
    } catch (error) {
      console.error("Error updating document name:", error)
      alert("Failed to update document name. Please try again.")
    }
  }

  const handleUpdateUnclassifiedDocumentName = async (docId: string, newName: string) => {
    if (!newName.trim()) {
      alert("Document name cannot be empty")
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").update({ title: newName.trim() }).eq("id", docId)

      if (error) throw error

      setUnclassifiedDocs((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, title: newName.trim() } : doc)))
      setEditingUnclassifiedDocId(null)
      setEditingUnclassifiedDocName("")
      await fetchUnclassifiedDocuments() // Refetch to ensure consistency
    } catch (error) {
      console.error("Error updating document name:", error)
      alert("Failed to update document name. Please try again.")
    }
  }

  const handleUpdateDocumentType = async (docId: string, documentTypeId: string | null) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").update({ document_type_id: documentTypeId }).eq("id", docId)

      if (error) throw error

      await fetchClassifiedDocuments()
      setEditingDocTypeId(null)
    } catch (error) {
      console.error("Error updating document type:", error)
      alert("Failed to update document type. Please try again.")
    }
  }

  const handleCreateDocumentType = async (docId: string) => {
    if (!newDocTypeName.trim()) {
      alert("Document type name cannot be empty")
      return
    }

    const supabase = createClient()
    try {
      // Create new document type
      const { data: newDocType, error: createError } = await supabase
        .from("document_types")
        .insert({ name: newDocTypeName.trim() })
        .select()
        .single()

      if (createError) throw createError

      // Update document with new type
      const { error: updateError } = await supabase
        .from("documents")
        .update({ document_type_id: newDocType.id })
        .eq("id", docId)

      if (updateError) throw updateError

      // Refresh data
      await fetchDocumentTypes()
      await fetchClassifiedDocuments()
      setNewDocTypeName("")
      setShowNewDocTypeInput(null)
      setEditingDocTypeId(null)
    } catch (error) {
      console.error("Error creating document type:", error)
      alert("Failed to create document type. Please try again.")
    }
  }

  const handlePriorityRemove = async (docId: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").update({ priority: null }).eq("id", docId)

      if (error) throw error

      // Refresh the unclassified documents list to update all tabs
      await fetchUnclassifiedDocuments()

      // Clear the selected document if it was selected
      if (selectedDocId === docId) {
        setSelectedDocId(null)
      }
    } catch (error) {
      console.error("Error removing priority:", error)
      alert("Failed to remove priority. Please try again.")
    }
  }

  const handlePrioritySelect = async (priority: string) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    const supabase = createClient()

    try {
      // Update database
      const { error } = await supabase.from("documents").update({ priority: priority }).eq("id", selectedDocId)

      if (error) throw error

      // Update local state immediately
      setUnclassifiedDocs((prev) =>
        prev.map((doc) => (doc.id === selectedDocId ? { ...doc, priority: priority } : doc)),
      )

      // Switch to the correct priority tab
      if (priority === "red") {
        setActiveUnclassifiedTab("classify-red")
      } else if (priority === "yellow") {
        setActiveUnclassifiedTab("classify-yellow")
      } else if (priority === "green") {
        setActiveUnclassifiedTab("classify-green")
      }
    } catch (error) {
      console.error("Error updating priority:", error)
      alert("Failed to update priority. Please try again.")
    }
  }

  const handleUpdateAccessLevel = async (docId: string, accessLevel: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").update({ access_level: accessLevel }).eq("id", docId)

      if (error) throw error

      await fetchClassifiedDocuments()
      setEditingAccessLevel(null)
    } catch (error) {
      console.error("Error updating access level:", error)
      alert("Failed to update access level. Please try again.")
    }
  }

  const handleUpdateDivision = async (
    docId: string,
    divisionId: string | null,
    divisionName: string | null,
    secretaryId: string | null,
    executiveDirectorId: string | null,
  ) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          division_id: divisionId,
          secretary_id: secretaryId,
          executive_director_id: executiveDirectorId,
          // Reset department when division changes or is cleared
          department_id: null,
        })
        .eq("id", docId)

      if (error) throw error

      await fetchClassifiedDocuments()
      setEditingDivision(null)
      // Clear classification state for department and location when division changes
      setClassifications((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          departmentId: undefined,
          departmentName: undefined,
          location: undefined,
        },
      }))
    } catch (error) {
      console.error("Error updating division:", error)
      alert("Failed to update division. Please try again.")
    }
  }

  const handleUpdateDepartment = async (docId: string, departmentId: string | null) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("documents")
        .update({ department_id: departmentId || null })
        .eq("id", docId)

      if (error) throw error

      await fetchClassifiedDocuments()
      setEditingDepartment(null)
    } catch (error) {
      console.error("Error updating department:", error)
      alert("Failed to update department. Please try again.")
    }
  }


  const handleUpdatePriority = async (docId: string, priority: string) => {
    const supabase = createClient()
    try {
      const priorityValue = priority === "" ? null : priority

      console.log("[v0] Updating priority:", { docId, priority, priorityValue })

      const { error } = await supabase.from("documents").update({ priority: priorityValue }).eq("id", docId)

      if (error) {
        console.error("[v0] Priority update error:", error)
        throw error
      }

      console.log("[v0] Priority updated successfully")
      await fetchClassifiedDocuments()
      setEditingPriority(null)
    } catch (error) {
      console.error("Error updating priority:", error)
      alert("Failed to update priority. Please try again.")
    }
  }

  const handlePathUpdate = async (path: string) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("documents")
        .update({ path: path.trim() || null })
        .eq("id", selectedDocId)

      if (error) throw error

      // Update local state
      setUnclassifiedDocs((prev) =>
        prev.map((doc) => (doc.id === selectedDocId ? { ...doc, path: path.trim() || null } : doc)),
      )

      console.log("[v0] Path updated successfully")
    } catch (error) {
      console.error("[v0] Error updating path:", error)
      alert("Failed to update path. Please try again.")
    }
  }

  const handleFileUrlUpdate = async (url: string) => {
    if (!selectedDocId) {
      alert("Please select a document first")
      return
    }

    const supabase = createClient()
    try {
      const clean = url.trim()
      const { error } = await supabase
        .from("documents")
        .update({ file_url: clean || null })
        .eq("id", selectedDocId)

      if (error) throw error

      // Update local state
      setUnclassifiedDocs((prev) =>
        prev.map((doc) => (doc.id === selectedDocId ? { ...doc, file_url: clean || null } : doc)),
      )

      console.log("[v0] File URL updated successfully")
    } catch (error) {
      console.error("[v0] Error updating file URL:", error)
      alert("Failed to update file URL. Please try again.")
    }
  }

  // Build a Google Drive search URL from the stored path
  const buildDriveSearchLink = (raw: string | null | undefined) => {
    if (!raw) return null
    const normalized = raw.trim().replace(/\\/g, "/")
    const q = encodeURIComponent(normalized)
    return `https://drive.google.com/drive/search?q=${q}`
  }

  // Prefer explicit file_url, else fallback to Drive search using path
  const buildOpenLink = (doc: Document | undefined) => {
    if (!doc) return "#"
    const url = (doc.file_url || "").trim()
    if (url) return url
    const path = (doc.path || "").trim()
    const search = buildDriveSearchLink(path)
    return search || "#"
  }

  const handleSort = (
    field:
      | "title"
      | "access_level"
      | "division"
      | "department"
      | "group_name"
      | "document_type"
      | "priority",
    shiftKey = false,
  ) => {
    if (shiftKey) {
      // Multi-column sort
      const existingIndex = sortColumns.findIndex((col) => col.field === field)
      if (existingIndex >= 0) {
        // Toggle direction or remove if already desc
        const newColumns = [...sortColumns]
        if (newColumns[existingIndex].direction === "asc") {
          newColumns[existingIndex].direction = "desc"
        } else {
          newColumns.splice(existingIndex, 1)
        }
        setSortColumns(newColumns.length > 0 ? newColumns : [{ field: "title", direction: "asc" }])
      } else {
        // Add new sort column
        setSortColumns([...sortColumns, { field, direction: "asc" }])
      }
    } else {
      // Single column sort
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortField(field as any)
        setSortDirection("asc")
      }
      setSortColumns([{ field, direction: sortField === field && sortDirection === "asc" ? "desc" : "asc" }])
    }
  }

  const clearAllSorts = () => {
    setSortColumns([{ field: "title", direction: "asc" }])
    setSortField("title")
    setSortDirection("asc")
  }

  const sortedClassifiedDocs = [...classifiedDocs].sort((a, b) => {
    for (const sortCol of sortColumns) {
      let aValue = ""
      let bValue = ""
      let result = 0

      if (sortCol.field === "title") {
        aValue = a.title || ""
        bValue = b.title || ""
        result = aValue.localeCompare(bValue)
      } else if (sortCol.field === "access_level") {
        aValue = a.access_level || ""
        bValue = b.access_level || ""
        result = aValue.localeCompare(bValue)
      } else if (sortCol.field === "division") {
        aValue = a.division_name || ""
        bValue = b.division_name || ""
        result = aValue.localeCompare(bValue)
      } else if (sortCol.field === "department") {
        aValue = a.department_name || ""
        bValue = b.department_name || ""
        result = aValue.localeCompare(bValue)
      } else if (sortCol.field === "document_type") {
        aValue = (a as any).document_type?.name || ""
        bValue = (b as any).document_type?.name || ""
        result = aValue.localeCompare(bValue)
      } else if (sortCol.field === "priority") {
        const priorityOrder = { red: 1, yellow: 2, green: 3 }
        const aPriority = a.priority ? priorityOrder[a.priority as keyof typeof priorityOrder] || 999 : 999
        const bPriority = b.priority ? priorityOrder[b.priority as keyof typeof priorityOrder] || 999 : 999
        result = aPriority - bPriority
      }

      if (result !== 0) {
        return sortCol.direction === "asc" ? result : -result
      }
    }
    return 0
  })

  const getDivisionColor = (divisionName: string) => {
    const color = divisionColorsMap[divisionName] || "#CACECF"
    return color
  }

  const getDepartmentColor = (divisionName: string) => {
    const hex = divisionColorsMap[divisionName] || "#CACECF"
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)

    return {
      style: { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.6)` },
      text: "text-gray-900",
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "red":
        return { bg: "#EF4444", text: "#FFFFFF" }
      case "yellow":
        return { bg: "#EAB308", text: "#000000" }
      case "green":
        return { bg: "#22C55E", text: "#FFFFFF" }
      default:
        return { bg: "#D1D5DB", text: "#000000" }
    }
  }

  const selectedDivisionDepartments =
    selectedDocId && classifications[selectedDocId]?.divisionId
      ? allDivisions.find((div) => div.id === classifications[selectedDocId].divisionId)?.departments || []
      : []

  const handleDeleteDocument = async (docId: string, isClassified: boolean) => {
    if (!confirm("Are you sure you want to permanently delete this document?")) {
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase.from("documents").delete().eq("id", docId)

      if (error) throw error

      if (isClassified) {
        setClassifiedDocs((prev) => prev.filter((d) => d.id !== docId))
        await fetchClassifiedDocuments() // Refetch to update counts and pagination
      } else {
        setUnclassifiedDocs((prev) => prev.filter((d) => d.id !== docId))
        await fetchUnclassifiedDocuments() // Refetch to update counts and pagination
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handleBulkDelete = async (isClassified = true, currentTab = "all") => {
    const selectedIds = isClassified ? selectedClassifiedIds : selectedUnclassifiedIds
    const setSelectedIds = isClassified ? setSelectedClassifiedIds : setSelectedUnclassifiedIds
    const totalDocs = isClassified ? totalClassified : totalUnclassified
    const fetchFn = isClassified ? fetchClassifiedDocuments : fetchUnclassifiedDocuments
    const selectAllMode = isClassified ? selectAllClassifiedMode : selectAllUnclassifiedMode
    const setSelectAllMode = isClassified ? setSelectAllClassifiedMode : setSelectAllUnclassifiedMode

    if (selectedIds.size === 0 && selectAllMode !== "all") return

    const deleteCount = selectAllMode === "all" ? totalDocs : selectedIds.size
    if (!confirm(`Are you sure you want to delete ${deleteCount} documents?`)) return

    setDeleting(true)
    // Initialize progress state for deletion
    setDeleteProgress({ current: 0, total: deleteCount })
    try {
      let idsToDelete: string[] = []
      const supabase = createClient()

      if (selectAllMode === "all") {
        console.log("[v0] Fetching all document IDs to delete with filters:", { isClassified, currentTab, searchQuery })

        // Build query with the same filters as the display query
        let query = supabase.from("documents").select("id")

        if (isClassified) {
          query = query.not("access_level", "is", null)
        } else {
          query = query.is("access_level", null)

          // Apply priority filter based on current tab
          if (currentTab === "red") {
            query = query.eq("priority", "red")
          } else if (currentTab === "yellow") {
            query = query.eq("priority", "yellow")
          } else if (currentTab === "green") {
            query = query.eq("priority", "green")
          }
        }

        // Apply search filter if active
        if (searchQuery.trim()) {
          query = query.ilike("title", `%${searchQuery}%`)
        }

        query = query.limit(100000)

        const { data, error } = await query
        if (error) throw error
        idsToDelete = data?.map((d) => d.id) || []

        console.log("[v0] Found", idsToDelete.length, "documents to delete")
      } else {
        idsToDelete = Array.from(selectedIds)
      }

      if (idsToDelete.length === 0) {
        alert("No documents to delete")
        setDeleting(false)
        setDeleteProgress(null) // Clear progress if no documents to delete
        return
      }

      const batchSize = 500
      let deletedCount = 0

      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)
        const { error } = await supabase.from("documents").delete().in("id", batch)
        if (error) throw error

        deletedCount += batch.length
        setDeleteProgress({ current: deletedCount, total: idsToDelete.length })
        console.log("[v0] Deleted", deletedCount, "of", idsToDelete.length, "documents")
      }

      console.log("[v0] Successfully deleted all", deletedCount, "documents")
      setSelectedIds(new Set())
      setSelectAllMode("page")
      setDeleteProgress(null) // Clear progress after successful deletion
      await fetchFn()
    } catch (error) {
      console.error("[v0] Error deleting documents:", error)
      alert("Failed to delete documents: " + (error as Error).message)
    } finally {
      setDeleting(false)
      setDeleteProgress(null) // Ensure progress is cleared in finally block
    }
  }

  const toggleSelectAll = (isClassified: boolean) => {
    if (isClassified) {
      const visibleDocs = filteredClassifiedDocs
      const allSelectedOnPage = selectedClassifiedIds.size === visibleDocs.length && selectAllClassifiedMode === "page"

      if (selectAllClassifiedMode === "all") {
        // Deselect all
        setSelectedClassifiedIds(new Set())
        setSelectAllClassifiedMode("page")
      } else if (allSelectedOnPage) {
        // If all on page are selected, switch to "select all mode"
        setSelectAllClassifiedMode("all")
      } else {
        // Select all on page
        setSelectedClassifiedIds(new Set(visibleDocs.map((d) => d.id)))
        setSelectAllClassifiedMode("page")
      }
    } else {
      const visibleDocs = filteredUnclassifiedDocs
      const allSelectedOnPage =
        selectedUnclassifiedIds.size === visibleDocs.length && selectAllUnclassifiedMode === "page"

      if (selectAllUnclassifiedMode === "all") {
        setSelectedUnclassifiedIds(new Set())
        setSelectAllUnclassifiedMode("page")
      } else if (allSelectedOnPage) {
        setSelectAllUnclassifiedMode("all")
      } else {
        setSelectedUnclassifiedIds(new Set(visibleDocs.map((d) => d.id)))
        setSelectAllUnclassifiedMode("page")
      }
    }
  }

  const toggleSelectDocument = (docId: string, isClassified: boolean) => {
    const selectedSet = isClassified ? selectedClassifiedIds : selectedUnclassifiedIds
    const setSelected = isClassified ? setSelectedClassifiedIds : setSelectedUnclassifiedIds

    const newSet = new Set(selectedSet)
    if (newSet.has(docId)) {
      newSet.delete(docId)
    } else {
      newSet.add(docId)
    }
    setSelected(newSet)

    if (isClassified && selectAllClassifiedMode === "all") {
      setSelectAllClassifiedMode("page")
    }
    if (!isClassified && selectAllUnclassifiedMode === "all") {
      setSelectAllUnclassifiedMode("page")
    }
  }

  const filteredUnclassifiedDocs = unclassifiedDocs.filter((doc) => !doc.priority || doc.priority === "")
  const filteredRedDocs = unclassifiedDocs.filter((doc) => doc.priority === "red")
  const filteredYellowDocs = unclassifiedDocs.filter((doc) => doc.priority === "yellow")
  const filteredGreenDocs = unclassifiedDocs.filter((doc) => doc.priority === "green")
  const filteredClassifiedDocs = sortedClassifiedDocs

  const renderPaginationControls = (total: number) => {
    const totalPages = Math.ceil(total / pageSize)

    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="h-8 text-sm border rounded px-2"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} of {total}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="h-8 w-8 p-0">
                1
              </Button>
              {startPage > 2 && <span className="text-muted-foreground">...</span>}
            </>
          )}

          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} className="h-8 w-8 p-0">
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-3" />
          </Button>
        </div>
      </div>
    )
  }

  const renderDocumentList = (docs: Document[], tabName: string) => {
    const groupedDocs = docs.reduce(
      (acc, doc) => {
        const groupName = doc.group_name || "_ungrouped"
        if (!acc[groupName]) {
          acc[groupName] = []
        }
        acc[groupName].push(doc)
        return acc
      },
      {} as Record<string, Document[]>,
    )

    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {tabName === "all"
                ? "Unclassified Documents"
                : `${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Priority`}
              {!loading && !bulkOperationProgress && !deleting && selectedUnclassifiedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkDelete(false, tabName)}
                  className="gap-2"
                >
                  {bulkOperationProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {bulkOperationProgress.current}/{bulkOperationProgress.total}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete {selectAllUnclassifiedMode === "all" ? totalUnclassified : selectedUnclassifiedIds.size}{" "}
                      selected
                    </>
                  )}
                </Button>
              )}
              <Badge variant="secondary">{totalUnclassified}</Badge>
            </div>
          </CardTitle>
          {docs.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={
                  docs.length > 0 &&
                  (selectAllUnclassifiedMode === "all" || selectedUnclassifiedIds.size === docs.length)
                }
                onCheckedChange={() => toggleSelectAll(false)}
                id={`select-all-${tabName}`}
              />
              <label htmlFor={`select-all-${tabName}`} className="text-sm text-muted-foreground cursor-pointer">
                Select all
              </label>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Loading documents...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch your documents</p>
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <Check className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">
                  {searchQuery ? "No documents found" : "No documents in this priority"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery
                    ? "Try a different search term"
                    : "Documents will appear here when assigned this priority."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {Object.entries(groupedDocs).map(([groupName, groupDocs]) => (
                    <div key={groupName} className="space-y-2">
                      {groupName !== "_ungrouped" && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">{groupName}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {groupDocs.length}
                          </Badge>
                        </div>
                      )}
                      {groupDocs.map((doc) => {
                        const classification = classifications[doc.id]
                        const isSelected = selectedDocId === doc.id
                        const divisionColor = classification?.divisionName
                          ? getDivisionColor(classification.divisionName)
                          : null
                        const departmentColor = classification?.divisionName
                          ? getDepartmentColor(classification.divisionName)
                          : null

                        return (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Checkbox
                                checked={selectedUnclassifiedIds.has(doc.id)}
                                onCheckedChange={() => toggleSelectDocument(doc.id, false)}
                                className="mt-0.5"
                              />
                              <div
                                onClick={() => !editingUnclassifiedDocId && handleDocumentClick(doc.id)}
                                className="flex-1 text-left hover:text-primary transition-colors min-w-0 cursor-pointer"
                              >
                                {editingUnclassifiedDocId === doc.id ? (
                                  <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      value={editingUnclassifiedDocName}
                                      onChange={(e) => setEditingUnclassifiedDocName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUpdateUnclassifiedDocumentName(doc.id, editingUnclassifiedDocName)
                                        } else if (e.key === "Escape") {
                                          setEditingUnclassifiedDocId(null)
                                          setEditingUnclassifiedDocName("")
                                        }
                                      }}
                                      className="h-7 text-sm flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateUnclassifiedDocumentName(doc.id, editingUnclassifiedDocName)
                                      }
                                      className="h-7 px-2"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingUnclassifiedDocId(null)
                                        setEditingUnclassifiedDocName("")
                                      }}
                                      className="h-7 px-2"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group mb-1.5">
                                    <p className="font-medium text-sm flex-1 break-words">{doc.title}</p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingUnclassifiedDocId(doc.id)
                                        setEditingUnclassifiedDocName(doc.title)
                                      }}
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}

                                {(classification?.access_level ||
                                  classification?.divisionName ||
                                  classification?.departmentName ||
                                  doc.priority) && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {classification?.access_level && (
                                      <Badge
                                        variant="outline"
                                        className={`gap-1 rounded-full text-xs px-2 py-0.5 ${
                                          classification.access_level === "Sea Org"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-green-50 text-green-700 border-green-200"
                                        }`}
                                      >
                                        <Lock className="h-3 w-3" />
                                        {classification.access_level}
                                      </Badge>
                                    )}
                                    {classification?.divisionName && divisionColor && (
                                      <span
                                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                                        style={{
                                          backgroundColor: divisionColor,
                                          color: "#000000",
                                        }}
                                      >
                                        {classification.divisionName}
                                      </span>
                                    )}
                                    {classification?.departmentName && departmentColor && (
                                      <span
                                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                                        style={{
                                          ...departmentColor.style,
                                          color: "#000000",
                                        }}
                                      >
                                        {classification.departmentName}
                                      </span>
                                    )}
                                    {doc.priority && (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handlePriorityRemove(doc.id)
                                        }}
                                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{
                                          backgroundColor: getPriorityColor(doc.priority).bg,
                                          color: getPriorityColor(doc.priority).text,
                                        }}
                                        title="Click to remove priority"
                                      >
                                        {doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDocument(doc.id, false)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                                title="Delete permanently"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                {renderPaginationControls(totalUnclassified)}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Reusable classification panel component
  const renderClassificationPanel = () => {
    const selectedDoc = unclassifiedDocs.find((d) => d.id === selectedDocId)
    const selectedDocGroupCount = selectedDoc?.group_name
      ? unclassifiedDocs.filter((d) => d.group_name === selectedDoc.group_name).length
      : 0

    return (
      <div className="w-[25%] flex-shrink-0">
        <div className="space-y-4 sticky top-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="h-4 w-4" />
                Document Path
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Add Google Drive or external link to this document</p>
            </CardHeader>
            <CardContent>
              {!selectedDocId ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a document to add a path</p>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Folder Path (for filtering)</p>
                    <Input
                      type="text"
                      placeholder="Indexes and lists/Official+list+of+books+and+materials.pdf"
                      defaultValue={selectedDoc?.path || ""}
                      onBlur={(e) => handlePathUpdate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handlePathUpdate(e.currentTarget.value)
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                  {(selectedDoc?.file_url || selectedDoc?.path) && (
                    <a
                      href={buildOpenLink(selectedDoc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Open link
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                Select Priority
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Click a priority to set it. Click again to remove it.
              </p>
            </CardHeader>
            <CardContent>
              {!selectedDocId ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a document to set its priority</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "red", label: "Red", bg: "#EF4444", text: "#FFFFFF" },
                    { value: "yellow", label: "Yellow", bg: "#EAB308", text: "#000000" },
                    { value: "green", label: "Green", bg: "#22C55E", text: "#FFFFFF" },
                  ].map((priority) => {
                    const isSelected =
                      unclassifiedDocs.find((d) => d.id === selectedDocId)?.priority === priority.value ||
                      classifications[selectedDocId]?.priority === priority.value

                    return (
                      <button
                        key={priority.value}
                        onClick={() => handlePrioritySelect(priority.value)}
                        style={{
                          backgroundColor: priority.bg,
                          color: priority.text,
                          border: isSelected ? "2px solid #000" : "2px solid transparent",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          borderRadius: "9999px",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          minWidth: "80px",
                        }}
                        className={`hover:opacity-80 ${isSelected ? "ring-2 ring-offset-2 ring-black" : ""}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1"
                        }}
                      >
                        {priority.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                1. Select Access Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDocId ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a document first</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {["Public", "Sea Org"].map((accessLevel) => {
                    const isSelected = classifications[selectedDocId]?.access_level === accessLevel

                    return (
                      <Button
                        key={accessLevel}
                        onClick={() => handleAccessLevelSelect(accessLevel)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        style={{
                          backgroundColor: isSelected
                            ? accessLevel === "Sea Org"
                              ? "#FEE2E2"
                              : "#D1FAE5"
                            : "transparent",
                          color: accessLevel === "Sea Org" ? "#991B1B" : "#065F46",
                          borderColor: accessLevel === "Sea Org" ? "#FCA5A5" : "#6EE7B7",
                        }}
                        className="rounded-full"
                      >
                        {accessLevel}
                      </Button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderTree className="h-4 w-4" />
                2. Select Division
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDocId || !classifications[selectedDocId]?.access_level ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select access level first</p>
              ) : allDivisions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No divisions available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allDivisions.map((div) => {
                    const divisionColor = getDivisionColor(div.name)
                    const isSelected = classifications[selectedDocId]?.divisionId === div.id

                    return (
                      <button
                        key={div.id}
                        onClick={() => handleDivisionSelect(div.id, div.name, div.secretaryId, div.executiveDirectorId)}
                        style={{
                          backgroundColor: divisionColor,
                          color: "#000000",
                          border: isSelected ? "2px solid #000" : "2px solid transparent",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          borderRadius: "9999px",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                          maxWidth: "160px",
                          whiteSpace: "normal",
                          textAlign: "center",
                          lineHeight: "1.3",
                          minHeight: "40px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className={`hover:opacity-80 ${isSelected ? "ring-2 ring-offset-2 ring-black" : ""}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1"
                        }}
                      >
                        {div.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Select Department</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDocId || !classifications[selectedDocId]?.divisionId ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select access level and division first</p>
              ) : selectedDivisionDepartments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No departments available for this division
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDivisionDepartments.map((dept) => {
                    const isSelected = classifications[selectedDocId]?.departmentId === dept.id
                    const divisionName = classifications[selectedDocId]?.divisionName
                    const divisionColor = divisionName ? getDivisionColor(divisionName) : null

                    let departmentBgColor = "rgba(226, 232, 240, 0.6)"
                    if (divisionColor) {
                      const hex = divisionColor.slice(1)
                      const r = Number.parseInt(hex.slice(0, 2), 16)
                      const g = Number.parseInt(hex.slice(2, 4), 16)
                      const b = Number.parseInt(hex.slice(4, 6), 16)
                      departmentBgColor = `rgba(${r}, ${g}, ${b}, 0.6)`
                    }

                    return (
                      <button
                        key={dept.id}
                        onClick={() => handleDepartmentSelect(dept.id, dept.name)}
                        disabled={classifying}
                        style={{
                          backgroundColor: departmentBgColor,
                          color: "#000000",
                          border: isSelected ? "2px solid #000" : "2px solid transparent",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          borderRadius: "9999px",
                          cursor: classifying ? "not-allowed" : "pointer",
                          opacity: classifying ? 0.5 : 1,
                          transition: "opacity 0.2s",
                          maxWidth: "180px",
                          whiteSpace: "normal",
                          textAlign: "center",
                          lineHeight: "1.3",
                          minHeight: "40px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className={isSelected ? "ring-2 ring-offset-2 ring-black" : ""}
                        onMouseEnter={(e) => {
                          if (!classifying) e.currentTarget.style.opacity = "0.8"
                        }}
                        onMouseLeave={(e) => {
                          if (!classifying) e.currentTarget.style.opacity = "1"
                        }}
                      >
                        {classifying && isSelected ? "Classifying..." : dept.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleExportUnclassified = () => {
    // Implementation for exporting unclassified documents
    alert("Export Unclassified - Feature not yet implemented")
  }

  const handleExportClassified = () => {
    // Implementation for exporting classified documents
    alert("Export Classified - Feature not yet implemented")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-start">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents... (e.g., Update, packs, 1983, HCOPL)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            {folders.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsFolderDrawerOpen(true)}
                className="border border-black flex-shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter by Folder
                {selectedFolderIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedFolderIds.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>
          {selectedFolderIds.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Folder className="h-3 w-3 mr-1" />
                Filtering by {selectedFolderIds.length} folder{selectedFolderIds.length !== 1 ? "s" : ""}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFolderIds([])
                  setCurrentPage(1)
                }}
                className="h-6 px-2 text-xs bg-yellow-400 hover:bg-yellow-500 border border-black"
              >
                <XSquare className="h-3 w-3 mr-1" />
                Clear Filter
              </Button>
            </div>
          )}
          {searchQuery && !loading && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {totalUnclassified} unclassified and {totalClassified} classified documents
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Unclassified Documents */}
      <Tabs value={activeUnclassifiedTab} onValueChange={setActiveUnclassifiedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="classify" className="px-8">
            All ({filteredUnclassifiedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="classify-red" className="px-8">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
            Red ({filteredRedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="classify-yellow" className="px-8">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-500" />
            Yellow ({filteredYellowDocs.length})
          </TabsTrigger>
          <TabsTrigger value="classify-green" className="px-8">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
            Green ({filteredGreenDocs.length})
          </TabsTrigger>
          <TabsTrigger value="classified" className="px-8">
            <Check className="mr-2 h-4 w-4" />
            Classified ({classifiedDocs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classified" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Classified Documents
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportClassified} className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  {selectedClassifiedIds.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => handleBulkDelete(true)} className="gap-2">
                      {" "}
                      {/* Pass true for classified */}
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" /> Delete {selectedClassifiedIds.size} selected
                        </>
                      )}
                    </Button>
                  )}
                  <Badge variant="secondary">{totalClassified}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectAllClassifiedMode === "page" &&
                selectedClassifiedIds.size === filteredClassifiedDocs.length &&
                selectedClassifiedIds.size > 0 &&
                totalClassified > filteredClassifiedDocs.length && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                    <p className="text-sm text-blue-900">
                      All {filteredClassifiedDocs.length} documents on this page are selected.{" "}
                      <button
                        onClick={() => {
                          setSelectAllClassifiedMode("all")
                          // Select all IDs (we'll handle this in bulk operations)
                        }}
                        className="font-medium underline hover:no-underline"
                      >
                        Select all {totalClassified} documents
                      </button>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClassifiedIds(new Set())
                        setSelectAllClassifiedMode("page")
                      }}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              {selectAllClassifiedMode === "all" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                  <p className="text-sm text-blue-900 font-medium">All {totalClassified} documents are selected.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedClassifiedIds(new Set())
                      setSelectAllClassifiedMode("page")
                    }}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
              {sortColumns.length > 1 && (
                <div className="mb-4 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Sorting by {sortColumns.length} columns (hold Shift to add more)
                  </p>
                  <Button variant="outline" size="sm" onClick={clearAllSorts}>
                    Clear all sorts
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          filteredClassifiedDocs.length > 0 &&
                          (selectAllClassifiedMode === "all" ||
                            selectedClassifiedIds.size === filteredClassifiedDocs.length)
                        }
                        onCheckedChange={() => toggleSelectAll(true)}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("title", e.shiftKey)}>
                      Document Name{" "}
                      {sortColumns.findIndex((col) => col.field === "title") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "title")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">{sortColumns.findIndex((col) => col.field === "title") + 1}</sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("priority", e.shiftKey)}>
                      Priority{" "}
                      {sortColumns.findIndex((col) => col.field === "priority") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "priority")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">{sortColumns.findIndex((col) => col.field === "priority") + 1}</sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("access_level", e.shiftKey)}>
                      Access{" "}
                      {sortColumns.findIndex((col) => col.field === "access_level") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "access_level")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">
                              {sortColumns.findIndex((col) => col.field === "access_level") + 1}
                            </sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("division", e.shiftKey)}>
                      Division{" "}
                      {sortColumns.findIndex((col) => col.field === "division") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "division")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">{sortColumns.findIndex((col) => col.field === "division") + 1}</sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("department", e.shiftKey)}>
                      Department{" "}
                      {sortColumns.findIndex((col) => col.field === "department") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "department")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">
                              {sortColumns.findIndex((col) => col.field === "department") + 1}
                            </sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={(e) => handleSort("document_type", e.shiftKey)}>
                      Document{" "}
                      {sortColumns.findIndex((col) => col.field === "document_type") >= 0 && (
                        <span className="text-primary">
                          {sortColumns.find((col) => col.field === "document_type")?.direction === "asc" ? "↑" : "↓"}
                          {sortColumns.length > 1 && (
                            <sup className="ml-0.5">
                              {sortColumns.findIndex((col) => col.field === "document_type") + 1}
                            </sup>
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassifiedDocs.map((doc) => {
                    const divisionColor = doc.division_name ? getDivisionColor(doc.division_name) : null
                    const departmentColor = doc.division_name ? getDepartmentColor(doc.division_name) : null

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClassifiedIds.has(doc.id)}
                            onCheckedChange={() => toggleSelectDocument(doc.id, true)}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px]">
                          {editingDocId === doc.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingDocName}
                                onChange={(e) => setEditingDocName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateDocumentName(doc.id, editingDocName)
                                  } else if (e.key === "Escape") {
                                    setEditingDocId(null)
                                    setEditingDocName("")
                                  }
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDocumentName(doc.id, editingDocName)}
                                className="h-8 px-2"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="break-all">{doc.title}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingDocId(doc.id)
                                  setEditingDocName(doc.title || "")
                                }}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[100px]">
                          {editingPriority === doc.id ? (
                            <div className="space-y-2">
                              <select
                                value={doc.priority || ""}
                                onChange={(e) => handleUpdatePriority(doc.id, e.target.value)}
                                className="w-full h-8 text-sm border rounded px-2"
                              >
                                <option value="">None</option>
                                <option value="red">Red</option>
                                <option value="yellow">Yellow</option>
                                <option value="green">Green</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPriority(null)}
                                className="w-full h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <div className="flex flex-wrap gap-1">
                                {doc.priority ? (
                                  <span
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full border-0 min-h-[28px]"
                                    style={{
                                      backgroundColor: getPriorityColor(doc.priority).bg,
                                      color: getPriorityColor(doc.priority).text,
                                    }}
                                  >
                                    {doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingPriority(doc.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[120px]">
                          {editingAccessLevel === doc.id ? (
                            <div className="space-y-2">
                              <select
                                value={doc.access_level || ""}
                                onChange={(e) => handleUpdateAccessLevel(doc.id, e.target.value)}
                                className="w-full h-8 text-sm border rounded px-2"
                              >
                                <option value="">None</option>
                                <option value="Public">Public</option>
                                <option value="Sea Org">Sea Org</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingAccessLevel(null)}
                                className="w-full h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <div className="flex flex-wrap gap-1">
                                {doc.access_level ? (
                                  <Badge
                                    variant="outline"
                                    className={`gap-1 rounded-full max-w-[110px] whitespace-normal text-center min-h-[28px] py-1.5 ${
                                      doc.access_level === "Sea Org"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-green-50 text-green-700 border-green-200"
                                    }`}
                                  >
                                    <Lock className="h-3 w-3 flex-shrink-0" />
                                    <span className="break-words">{doc.access_level}</span>
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAccessLevel(doc.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[180px]">
                          {editingDivision === doc.id ? (
                            <div className="space-y-2">
                              <select
                                value={doc.division_id || ""}
                                onChange={(e) => {
                                  if (e.target.value === "") {
                                    handleUpdateDivision(doc.id, null, null, null, null)
                                  } else {
                                    const selectedDiv = allDivisions.find((d) => d.id === e.target.value)
                                    if (selectedDiv) {
                                      handleUpdateDivision(
                                        doc.id,
                                        selectedDiv.id,
                                        selectedDiv.name,
                                        selectedDiv.secretaryId,
                                        selectedDiv.executiveDirectorId,
                                      )
                                    }
                                  }
                                }}
                                className="w-full h-8 text-sm border rounded px-2"
                              >
                                <option value="">None</option>
                                {allDivisions.map((div) => (
                                  <option key={div.id} value={div.id}>
                                    {div.name}
                                  </option>
                                ))}
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingDivision(null)}
                                className="w-full h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <div className="flex flex-wrap gap-1">
                                {doc.division_name && divisionColor ? (
                                  <span
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full border-0 max-w-[160px] whitespace-normal text-center leading-tight min-h-[28px]"
                                    style={{
                                      backgroundColor: divisionColor, // Use database color
                                      color: "#000000",
                                    }}
                                  >
                                    {doc.division_name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingDivision(doc.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[200px]">
                          {editingDepartment === doc.id ? (
                            <div className="space-y-2">
                              <select
                                value={doc.department_id || ""}
                                onChange={(e) => handleUpdateDepartment(doc.id, e.target.value)}
                                className="w-full h-8 text-sm border rounded px-2"
                                disabled={!doc.division_id}
                              >
                                <option value="">None</option>
                                {doc.division_id &&
                                  allDivisions
                                    .find((d) => d.id === doc.division_id)
                                    ?.departments.map((dept) => (
                                      <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </option>
                                    ))}
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingDepartment(null)}
                                className="w-full h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <div className="flex flex-wrap gap-1">
                                {doc.department_name && departmentColor ? (
                                  <span
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-full border-0 max-w-[180px] whitespace-normal text-center leading-tight min-h-[28px]"
                                    style={{
                                      ...departmentColor.style,
                                      color: "#000000",
                                    }}
                                  >
                                    {doc.department_name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingDepartment(doc.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          {editingDocTypeId === doc.id ? (
                            <div className="space-y-2">
                              <select
                                value={(doc as any).document_type?.id || ""}
                                onChange={(e) => handleUpdateDocumentType(doc.id, e.target.value || null)}
                                className="w-full h-8 text-sm border rounded px-2"
                              >
                                <option value="">None</option>
                                {documentTypes.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.name}
                                  </option>
                                ))}
                              </select>
                              {showNewDocTypeInput === doc.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={newDocTypeName}
                                    onChange={(e) => setNewDocTypeName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleCreateDocumentType(doc.id)
                                      } else if (e.key === "Escape") {
                                        setShowNewDocTypeInput(null)
                                        setNewDocTypeName("")
                                      }
                                    }}
                                    placeholder="New type name"
                                    className="h-7 text-xs"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateDocumentType(doc.id)}
                                    className="h-7 px-2"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowNewDocTypeInput(doc.id)}
                                  className="w-full h-7 text-xs gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  New Type
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingDocTypeId(null)
                                  setShowNewDocTypeInput(null)
                                  setNewDocTypeName("")
                                }}
                                className="w-full h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              {(doc as any).document_type ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 rounded-full max-w-[160px] whitespace-normal text-center min-h-[28px] py-1.5"
                                >
                                  <FileText className="h-3 w-3 flex-shrink-0" />
                                  <span className="break-words">{(doc as any).document_type.name}</span>
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">None</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingDocTypeId(doc.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>


                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnclassify(doc.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                              title="Unclassify"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDocument(doc.id, true)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classify" className="mt-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            <div className="flex-1 min-w-0 overflow-hidden">{renderDocumentList(filteredUnclassifiedDocs, "all")}</div>
            {renderClassificationPanel()}
          </div>
        </TabsContent>

        <TabsContent value="classify-red" className="mt-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            <div className="flex-1 min-w-0 overflow-hidden">{renderDocumentList(filteredRedDocs, "red")}</div>
            {renderClassificationPanel()}
          </div>
        </TabsContent>

        <TabsContent value="classify-yellow" className="mt-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            <div className="flex-1 min-w-0 overflow-hidden">{renderDocumentList(filteredYellowDocs, "yellow")}</div>
            {renderClassificationPanel()}
          </div>
        </TabsContent>

        <TabsContent value="classify-green" className="mt-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            <div className="flex-1 min-w-0 overflow-hidden">{renderDocumentList(filteredGreenDocs, "green")}</div>
            {renderClassificationPanel()}
          </div>
        </TabsContent>
      </Tabs>

      {deleteProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Deleting Documents</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {deleteProgress.current} / {deleteProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Please wait while we delete your documents...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Folder Filter Drawer */}
      <FolderFilterDrawer
        open={isFolderDrawerOpen}
        onOpenChange={setIsFolderDrawerOpen}
        folders={folders}
        selectedFolderIds={selectedFolderIds}
        onApplyFilters={(folderIds) => {
          setSelectedFolderIds(folderIds)
          setCurrentPage(1)
        }}
        documentCounts={documentCounts}
      />
    </div>
  )
}
