"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { FileText, FolderTree, Plus, Trash2, Edit2, Check, X, Users, Eye, EyeOff } from "lucide-react"
import { bestFolderMatch, normalizeDrivePath, type FolderReference } from "@/lib/path-utils"

type DocumentType = {
  id: string
  name: string
}

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

interface AdminInterfaceProps {
  documentTypes: DocumentType[]
  organizationalStructure: ExecutiveDirector[]
}

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}



export function AdminInterface({ documentTypes: initialDocTypes, organizationalStructure }: AdminInterfaceProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocTypes)
  const [newDocTypeName, setNewDocTypeName] = useState("")
  const [editingDocTypeId, setEditingDocTypeId] = useState<string | null>(null)
  const [editingDocTypeName, setEditingDocTypeName] = useState("")
  const [divisions, setDivisions] = useState<any[]>([])
  const [newDivisionName, setNewDivisionName] = useState("")
  const [newDivisionColor, setNewDivisionColor] = useState("#CACECF")
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null)
  const [editingDivisionName, setEditingDivisionName] = useState("")
  const [editingDivisionColor, setEditingDivisionColor] = useState("")
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null)
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [editingDepartmentName, setEditingDepartmentName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [documentCount, setDocumentCount] = useState(0)
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [backfillUpdatedCount, setBackfillUpdatedCount] = useState(0)
  const [backfillTotal, setBackfillTotal] = useState(0)

  // User management state
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null)

  const supabase = createClient()

  const handleAddDocumentType = async () => {
    if (!newDocTypeName.trim()) {
      alert("Document type name cannot be empty")
      return
    }

    try {
      const { data, error } = await supabase
        .from("document_types")
        .insert({ name: newDocTypeName.trim() })
        .select()
        .single()

      if (error) throw error

      setDocumentTypes([...documentTypes, data])
      setNewDocTypeName("")
    } catch (error) {
      console.error("Error adding document type:", error)
      alert("Failed to add document type. Please try again.")
    }
  }

  const handleUpdateDocumentType = async (id: string, newName: string) => {
    if (!newName.trim()) {
      alert("Document type name cannot be empty")
      return
    }

    try {
      const { error } = await supabase.from("document_types").update({ name: newName.trim() }).eq("id", id)

      if (error) throw error

      setDocumentTypes(documentTypes.map((dt) => (dt.id === id ? { ...dt, name: newName.trim() } : dt)))
      setEditingDocTypeId(null)
      setEditingDocTypeName("")
    } catch (error) {
      console.error("Error updating document type:", error)
      alert("Failed to update document type. Please try again.")
    }
  }

  const handleDeleteDocumentType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document type? Documents using it will be unaffected.")) {
      return
    }

    try {
      const { error } = await supabase.from("document_types").delete().eq("id", id)

      if (error) throw error

      setDocumentTypes(documentTypes.filter((dt) => dt.id !== id))
    } catch (error) {
      console.error("Error deleting document type:", error)
      alert("Failed to delete document type. Please try again.")
    }
  }







  const handleAddDivision = async () => {
    if (!newDivisionName.trim()) {
      alert("Division name cannot be empty")
      return
    }

    try {
      console.log("[v0] Adding division:", newDivisionName.trim(), "with color:", newDivisionColor)

      const { data, error } = await supabase
        .from("divisions")
        .insert({
          name: newDivisionName.trim(),
          color: newDivisionColor,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Supabase error details:", error)
        throw error
      }

      console.log("[v0] Division added successfully:", data)
      await loadDivisions()
      setNewDivisionName("")
      setNewDivisionColor("#CACECF")
    } catch (error: any) {
      console.error("[v0] Error adding division:", error)
      alert(`Failed to add division: ${error.message || "Please try again."}`)
    }
  }

  const handleUpdateDivision = async (id: string, newName: string, newColor: string) => {
    if (!newName.trim()) {
      alert("Division name cannot be empty")
      return
    }

    try {
      const { data, error } = await supabase
        .from("divisions")
        .update({ name: newName.trim(), color: newColor })
        .eq("id", id)
        .select()

      if (error) {
        console.error("Error updating division:", error)
        throw error
      }

      await loadDivisions()
      setEditingDivisionId(null)
      setEditingDivisionName("")
      setEditingDivisionColor("")
    } catch (error) {
      console.error("Error updating division:", error)
      alert("Failed to update division. Please try again.")
    }
  }

  const handleDeleteDivision = async (id: string) => {
    if (!confirm("Are you sure you want to delete this division? All associated departments will also be deleted.")) {
      return
    }

    try {
      const { error } = await supabase.from("divisions").delete().eq("id", id)

      if (error) throw error

      await loadDivisions()
      if (selectedDivisionId === id) {
        setSelectedDivisionId(null)
      }
    } catch (error) {
      console.error("Error deleting division:", error)
      alert("Failed to delete division. Please try again.")
    }
  }

  const handleAddDepartment = async () => {
    if (!selectedDivisionId) {
      alert("Please select a division first")
      return
    }

    if (!newDepartmentName.trim()) {
      alert("Department name cannot be empty")
      return
    }

    try {
      const { error } = await supabase.from("departments").insert({
        name: newDepartmentName.trim(),
        division_id: selectedDivisionId,
      })

      if (error) throw error

      await loadDivisions()
      setNewDepartmentName("")
    } catch (error) {
      console.error("Error adding department:", error)
      alert("Failed to add department. Please try again.")
    }
  }

  const handleUpdateDepartment = async (id: string, newName: string) => {
    if (!newName.trim()) {
      alert("Department name cannot be empty")
      return
    }

    try {
      const { error } = await supabase.from("departments").update({ name: newName.trim() }).eq("id", id)

      if (error) throw error

      await loadDivisions()
      setEditingDepartmentId(null)
      setEditingDepartmentName("")
    } catch (error) {
      console.error("Error updating department:", error)
      alert("Failed to update department. Please try again.")
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return
    }

    try {
      const { error } = await supabase.from("departments").delete().eq("id", id)

      if (error) throw error

      await loadDivisions()
    } catch (error) {
      console.error("Error deleting department:", error)
      alert("Failed to delete department. Please try again.")
    }
  }

  const handleDeleteAllDocuments = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete ALL ${documentCount} imported documents? This action cannot be undone!`,
    )

    if (!confirmed) return

    const doubleConfirm = confirm(
      "This will permanently delete everything. Type 'DELETE' in the next prompt to confirm.",
    )

    if (!doubleConfirm) return

    const finalConfirm = prompt("Type 'DELETE' to confirm deletion of all imported documents:")

    if (finalConfirm !== "DELETE") {
      alert("Deletion cancelled. You must type 'DELETE' exactly.")
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) throw error

      alert("All imported documents have been deleted successfully!")
      setDocumentCount(0)
    } catch (error) {
      console.error("Error deleting all documents:", error)
      alert("Failed to delete documents. Please try again or contact support.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBackfillFolderIds = async () => {
    setIsBackfilling(true)
    setBackfillUpdatedCount(0)
    setBackfillTotal(0)

    try {
      const { data: folders, error: foldersError } = await supabase
        .from("folders")
        .select("id, full_path")
        .order("full_path", { ascending: false })
      if (foldersError) throw foldersError

      const folderRefs: FolderReference[] = (folders || []).map((f: any) => ({
        id: f.id,
        full_path: f.full_path,
        normalizedPath: normalizeDrivePath(f.full_path),
      }))

      const { count, error: countError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .is("folder_id", null)
        .not("path", "is", null)
      if (countError) throw countError
      setBackfillTotal(count || 0)

      const chunkSize = 1000
      let offset = 0

      while (true) {
        const { data: docs, error: docsError } = await supabase
          .from("documents")
          .select("id, path")
          .is("folder_id", null)
          .not("path", "is", null)
          .order("id", { ascending: true })
          .range(offset, offset + chunkSize - 1)

        if (docsError) throw docsError
        if (!docs || docs.length === 0) break

        for (const doc of docs) {
          const match = bestFolderMatch(doc.path, folderRefs)

          if (match) {
            const { error: updateError } = await supabase
              .from("documents")
              .update({ folder_id: match.id })
              .eq("id", doc.id)
            if (updateError) {
              console.error("[v0] Backfill update error", updateError)
              continue
            }
            setBackfillUpdatedCount((c) => c + 1)
          }
        }

        offset += chunkSize
      }

      alert("Backfill completed.")
    } catch (err: any) {
      console.error("Error backfilling folder_id:", err)
      alert(`Backfill failed: ${err.message || "Unknown error"}`)
    } finally {
      setIsBackfilling(false)
    }
  }

  const loadDivisions = async () => {
    try {
      const { data, error } = await supabase
        .from("divisions")
        .select(`
          id,
          name,
          color,
          departments (
            id,
            name
          )
        `)
        .order("name")

      if (error) throw error

      setDivisions(data || [])
    } catch (error) {
      console.error("Error loading divisions:", error)
    }
  }

  const loadDocumentCount = async () => {
    try {
      const { count, error } = await supabase.from("documents").select("*", { count: "exact", head: true })

      if (error) throw error

      setDocumentCount(count || 0)
    } catch (error) {
      console.error("Error loading document count:", error)
    }
  }

  // User management handlers
  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load users")
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error loading users:", error)
      alert("Failed to load users. Please try again.")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      alert("Email and password are required")
      return
    }

    if (newUserPassword.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    setIsCreatingUser(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail.trim(), password: newUserPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create user")
      }

      setNewUserEmail("")
      setNewUserPassword("")
      await loadUsers()
      alert("User created successfully!")
    } catch (error: any) {
      console.error("Error creating user:", error)
      alert(`Failed to create user: ${error.message}`)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return
    }

    setIsDeletingUser(userId)
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete user")
      }

      await loadUsers()
      alert("User deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting user:", error)
      alert(`Failed to delete user: ${error.message}`)
    } finally {
      setIsDeletingUser(null)
    }
  }

  useEffect(() => {
    loadDivisions()
    loadDocumentCount()
    loadUsers()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">Manage document types, divisions, departments, and users</p>
      </div>



      <Tabs defaultValue="document-types" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="document-types" className="gap-2">
            <FileText className="h-4 w-4" />
            Document Types
          </TabsTrigger>

          <TabsTrigger value="organization" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Organization
          </TabsTrigger>

          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document-types" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Types</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage reusable document classifications like "Saint Hill", "Course Materials", etc.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New document type name..."
                  value={newDocTypeName}
                  onChange={(e) => setNewDocTypeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddDocumentType()
                    }
                  }}
                />
                <Button onClick={handleAddDocumentType} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentTypes.map((docType) => (
                    <TableRow key={docType.id}>
                      <TableCell>
                        {editingDocTypeId === docType.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingDocTypeName}
                              onChange={(e) => setEditingDocTypeName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdateDocumentType(docType.id, editingDocTypeName)
                                } else if (e.key === "Escape") {
                                  setEditingDocTypeId(null)
                                  setEditingDocTypeName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateDocumentType(docType.id, editingDocTypeName)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDocTypeId(null)
                                setEditingDocTypeName("")
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span>{docType.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingDocTypeId(docType.id)
                              setEditingDocTypeName(docType.name)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteDocumentType(docType.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="organization" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Divisions</CardTitle>
                <p className="text-sm text-muted-foreground">Manage organizational divisions with colors</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Division name..."
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddDivision()
                      }
                    }}
                  />
                  <input
                    type="color"
                    value={newDivisionColor}
                    onChange={(e) => setNewDivisionColor(e.target.value)}
                    className="w-12 h-10 border-2 border-black cursor-pointer"
                    title="Division color"
                  />
                  <Button onClick={handleAddDivision} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {divisions.map((division) => (
                    <div
                      key={division.id}
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${selectedDivisionId === division.id ? "bg-gray-100" : "bg-white"
                        }`}
                      onClick={() => setSelectedDivisionId(division.id)}
                    >
                      {editingDivisionId === division.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingDivisionName}
                            onChange={(e) => setEditingDivisionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateDivision(division.id, editingDivisionName, editingDivisionColor)
                              } else if (e.key === "Escape") {
                                setEditingDivisionId(null)
                                setEditingDivisionName("")
                                setEditingDivisionColor("")
                              }
                            }}
                            autoFocus
                          />
                          <input
                            type="color"
                            value={editingDivisionColor}
                            onChange={(e) => setEditingDivisionColor(e.target.value)}
                            className="w-12 h-10 border-2 border-black cursor-pointer flex-shrink-0"
                            title="Division color"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdateDivision(division.id, editingDivisionName, editingDivisionColor)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingDivisionId(null)
                              setEditingDivisionName("")
                              setEditingDivisionColor("")
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 border-2 border-black flex-shrink-0"
                              style={{ backgroundColor: division.color || "#CACECF" }}
                            />
                            <span className="font-mono">{division.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({division.departments?.length || 0} depts)
                            </span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDivisionId(division.id)
                                setEditingDivisionName(division.name)
                                setEditingDivisionColor(division.color || "#CACECF")
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteDivision(division.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDivisionId
                    ? `Manage departments for ${divisions.find((d) => d.id === selectedDivisionId)?.name}`
                    : "Select a division to manage its departments"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDivisionId && (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Department name..."
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddDepartment()
                          }
                        }}
                      />
                      <Button onClick={handleAddDepartment} className="gap-2 whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {divisions
                        .find((d) => d.id === selectedDivisionId)
                        ?.departments?.map((department: any) => (
                          <div key={department.id} className="border-2 border-black p-3 bg-white">
                            {editingDepartmentId === department.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingDepartmentName}
                                  onChange={(e) => setEditingDepartmentName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateDepartment(department.id, editingDepartmentName)
                                    } else if (e.key === "Escape") {
                                      setEditingDepartmentId(null)
                                      setEditingDepartmentName("")
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleUpdateDepartment(department.id, editingDepartmentName)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingDepartmentId(null)
                                    setEditingDepartmentName("")
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="font-mono">{department.name}</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingDepartmentId(department.id)
                                      setEditingDepartmentName(department.name)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteDepartment(department.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {!selectedDivisionId && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderTree className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a division from the left to manage its departments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage users who can access the application
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create new user form */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-3">Create New User</h3>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    type="email"
                    placeholder="Email address..."
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="flex-1 min-w-[200px]"
                  />
                  <div className="relative flex-1 min-w-[200px]">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 characters)..."
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateUser()
                        }
                      }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleCreateUser} disabled={isCreatingUser} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isCreatingUser ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>

              {/* Users list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Existing Users ({users.length})</h3>
                  <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoadingUsers}>
                    {isLoadingUsers ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-sm">{user.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {user.email_confirmed_at ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Confirmed
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id, user.email || "")}
                              disabled={isDeletingUser === user.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-red-500 border-2">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <p className="text-sm text-muted-foreground">Irreversible actions that will permanently delete data</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="font-semibold text-red-900">Delete All Imported Documents</h3>
              <p className="text-sm text-red-700">
                Permanently delete all {documentCount.toLocaleString()} imported documents from the database. Your admin
                settings (document types, divisions, departments) will NOT be affected.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAllDocuments}
              disabled={isDeleting || documentCount === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete All Imported Documents"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilities</CardTitle>
          <p className="text-sm text-muted-foreground">Maintenance helpers for document metadata</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div>
              <h3 className="font-semibold text-amber-900">Backfill folder_id from document paths</h3>
              <p className="text-sm text-amber-700">Assign folders by matching path prefix to folder full_path.</p>
            </div>
            <Button onClick={handleBackfillFolderIds} disabled={isBackfilling} className="gap-2">
              <FolderTree className="h-4 w-4" />
              {isBackfilling ? "Backfilling..." : "Run Backfill"}
            </Button>
          </div>
          {(isBackfilling || backfillUpdatedCount > 0) && (
            <div className="mt-3 text-sm text-muted-foreground">
              <span className="font-mono">{backfillUpdatedCount} / {backfillTotal} updated</span>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
