"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { FileText, MapPin, FolderTree, Plus, Trash2, Edit2, Check, X } from "lucide-react"

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

const LOCATIONS = ["Google Drive", "Sent by Email", "Maria's Computer", "Local Server", "Cloud Storage"]

export function AdminInterface({ documentTypes: initialDocTypes, organizationalStructure }: AdminInterfaceProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocTypes)
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]) // Changed to store location objects with IDs from database
  const [newDocTypeName, setNewDocTypeName] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [editingDocTypeId, setEditingDocTypeId] = useState<string | null>(null)
  const [editingDocTypeName, setEditingDocTypeName] = useState("")
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null) // Will be replaced with editingLocationId
  const [editingLocationName, setEditingLocationName] = useState("")
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null) // Added to track which location is being edited
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

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      alert("Location name cannot be empty")
      return
    }

    try {
      const { data, error } = await supabase.from("locations").insert({ name: newLocation.trim() }).select().single()

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          alert("This location already exists")
          return
        }
        throw error
      }

      await loadLocations()
      setNewLocation("")
    } catch (error) {
      console.error("Error adding location:", error)
      alert("Failed to add location. Please try again.")
    }
  }

  const handleUpdateLocation = async (id: string, newName: string) => {
    if (!newName.trim()) {
      alert("Location name cannot be empty")
      return
    }

    try {
      const { error } = await supabase.from("locations").update({ name: newName.trim() }).eq("id", id)

      if (error) throw error

      await loadLocations()
      setEditingLocationId(null)
      setEditingLocationName("")
    } catch (error) {
      console.error("Error updating location:", error)
      alert("Failed to update location. Please try again.")
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return
    }

    try {
      const { error } = await supabase.from("locations").delete().eq("id", id)

      if (error) throw error

      await loadLocations()
    } catch (error) {
      console.error("Error deleting location:", error)
      alert("Failed to delete location. Please try again.")
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

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase.from("locations").select("id, name").order("name")

      if (error) throw error

      setLocations(data || [])
    } catch (error) {
      console.error("Error loading locations:", error)
    }
  }

  useEffect(() => {
    loadDivisions()
    loadDocumentCount()
    loadLocations() // Added to load locations from database on mount
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">Manage document types, locations, divisions, and departments</p>
      </div>

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
                settings (document types, locations, divisions, departments) will NOT be affected.
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

      <Tabs defaultValue="document-types" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="document-types" className="gap-2">
            <FileText className="h-4 w-4" />
            Document Types
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Organization
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

        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage where documents are stored (Google Drive, Email, etc.)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New location name..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddLocation()
                    }
                  }}
                />
                <Button onClick={handleAddLocation} className="gap-2">
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
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        {editingLocationId === location.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingLocationName}
                              onChange={(e) => setEditingLocationName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdateLocation(location.id, editingLocationName)
                                } else if (e.key === "Escape") {
                                  setEditingLocationId(null)
                                  setEditingLocationName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateLocation(location.id, editingLocationName)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingLocationId(null)
                                setEditingLocationName("")
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span>{location.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingLocationId(location.id)
                              setEditingLocationName(location.name)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteLocation(location.id)}
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
                      className={`border-2 border-black p-3 cursor-pointer transition-colors ${
                        selectedDivisionId === division.id ? "bg-gray-100" : "bg-white"
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
      </Tabs>
    </div>
  )
}
