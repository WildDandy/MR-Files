"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, FileText, ExternalLink } from "lucide-react"
import type { ExecutiveDirector, Secretary, Division, Department, Document } from "@/lib/types"

interface DocumentWithHierarchy extends Document {
  executive_directors?: { name: string }
  secretaries?: { name: string }
  divisions?: { name: string }
  departments?: { name: string }
}

export function DocumentSearch() {
  const supabase = createClient()

  // Search filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExecutiveDirector, setSelectedExecutiveDirector] = useState<string>("all")
  const [selectedSecretary, setSelectedSecretary] = useState<string>("all")
  const [selectedDivision, setSelectedDivision] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")

  // Hierarchy data
  const [executiveDirectors, setExecutiveDirectors] = useState<ExecutiveDirector[]>([])
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Search results
  const [documents, setDocuments] = useState<DocumentWithHierarchy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalResults, setTotalResults] = useState(0)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  // Load hierarchy data on mount
  useEffect(() => {
    loadHierarchyData()
  }, [])

  // Load filtered secretaries when executive director changes
  useEffect(() => {
    if (selectedExecutiveDirector && selectedExecutiveDirector !== "all") {
      loadSecretaries(selectedExecutiveDirector)
    } else {
      loadAllSecretaries()
    }
    setSelectedSecretary("all")
    setSelectedDivision("all")
    setSelectedDepartment("all")
  }, [selectedExecutiveDirector])

  // Load filtered divisions when secretary changes
  useEffect(() => {
    if (selectedSecretary && selectedSecretary !== "all") {
      loadDivisions(selectedSecretary)
    } else if (selectedExecutiveDirector && selectedExecutiveDirector !== "all") {
      loadDivisionsByExecutiveDirector(selectedExecutiveDirector)
    } else {
      loadAllDivisions()
    }
    setSelectedDivision("all")
    setSelectedDepartment("all")
  }, [selectedSecretary])

  // Load filtered departments when division changes
  useEffect(() => {
    if (selectedDivision && selectedDivision !== "all") {
      loadDepartments(selectedDivision)
    } else if (selectedSecretary && selectedSecretary !== "all") {
      loadDepartmentsBySecretary(selectedSecretary)
    } else {
      loadAllDepartments()
    }
    setSelectedDepartment("all")
  }, [selectedDivision])

  const loadHierarchyData = async () => {
    try {
      await Promise.all([loadExecutiveDirectors(), loadAllSecretaries(), loadAllDivisions(), loadAllDepartments()])
    } catch (error) {
      console.error("[v0] Error loading hierarchy data:", error)
    }
  }

  const loadExecutiveDirectors = async () => {
    const { data, error } = await supabase.from("executive_directors").select("*").order("name")
    if (error) {
      console.error("[v0] Error loading executive directors:", error)
      return
    }
    setExecutiveDirectors(data || [])
  }

  const loadAllSecretaries = async () => {
    const { data, error } = await supabase.from("secretaries").select("*").order("name")
    if (error) {
      console.error("[v0] Error loading secretaries:", error)
      return
    }
    setSecretaries(data || [])
  }

  const loadSecretaries = async (executiveDirectorId: string) => {
    const { data, error } = await supabase
      .from("secretaries")
      .select("*")
      .eq("executive_director_id", executiveDirectorId)
      .order("name")
    if (error) {
      console.error("[v0] Error loading filtered secretaries:", error)
      return
    }
    setSecretaries(data || [])
  }

  const loadAllDivisions = async () => {
    const { data, error } = await supabase.from("divisions").select("*").order("name")
    if (error) {
      console.error("[v0] Error loading divisions:", error)
      return
    }
    setDivisions(data || [])
  }

  const loadDivisions = async (secretaryId: string) => {
    const { data, error } = await supabase.from("divisions").select("*").eq("secretary_id", secretaryId).order("name")
    if (error) {
      console.error("[v0] Error loading filtered divisions:", error)
      return
    }
    setDivisions(data || [])
  }

  const loadDivisionsByExecutiveDirector = async (executiveDirectorId: string) => {
    const { data: secs, error: secError } = await supabase
      .from("secretaries")
      .select("id")
      .eq("executive_director_id", executiveDirectorId)

    if (secError) {
      console.error("[v0] Error loading secretaries for divisions:", secError)
      return
    }

    const secretaryIds = secs?.map((s) => s.id) || []

    if (secretaryIds.length === 0) {
      setDivisions([])
      return
    }

    const { data, error } = await supabase.from("divisions").select("*").in("secretary_id", secretaryIds).order("name")

    if (error) {
      console.error("[v0] Error loading divisions by executive director:", error)
      return
    }
    setDivisions(data || [])
  }

  const loadAllDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*").order("name")
    if (error) {
      console.error("[v0] Error loading departments:", error)
      return
    }
    setDepartments(data || [])
  }

  const loadDepartments = async (divisionId: string) => {
    const { data, error } = await supabase.from("departments").select("*").eq("division_id", divisionId).order("name")
    if (error) {
      console.error("[v0] Error loading filtered departments:", error)
      return
    }
    setDepartments(data || [])
  }

  const loadDepartmentsBySecretary = async (secretaryId: string) => {
    const { data: divs, error: divError } = await supabase
      .from("divisions")
      .select("id")
      .eq("secretary_id", secretaryId)

    if (divError) {
      console.error("[v0] Error loading divisions for departments:", divError)
      return
    }

    const divisionIds = divs?.map((d) => d.id) || []

    if (divisionIds.length === 0) {
      setDepartments([])
      return
    }

    const { data, error } = await supabase.from("departments").select("*").in("division_id", divisionIds).order("name")

    if (error) {
      console.error("[v0] Error loading departments by secretary:", error)
      return
    }
    setDepartments(data || [])
  }

  const handleSearch = async () => {
    setIsLoading(true)
    setHasSearched(true)
    setCurrentPage(1)

    try {
      let query = supabase
        .from("documents")
        .select(
          `
          id, title, description, file_type, file_url,
          divisions!documents_division_id_fkey(name),
          departments!documents_department_id_fkey(name),
          secretaries!documents_secretary_id_fkey(name),
          executive_directors!documents_executive_director_id_fkey(name)
        `,
          { count: "exact" },
        )
        .eq("status", "classified")
        .order("created_at", { ascending: false })

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      if (selectedExecutiveDirector && selectedExecutiveDirector !== "all") {
        query = query.eq("executive_director_id", selectedExecutiveDirector)
      }

      if (selectedSecretary && selectedSecretary !== "all") {
        query = query.eq("secretary_id", selectedSecretary)
      }

      if (selectedDivision && selectedDivision !== "all") {
        query = query.eq("division_id", selectedDivision)
      }

      if (selectedDepartment && selectedDepartment !== "all") {
        query = query.eq("department_id", selectedDepartment)
      }

      const { data: docs, error, count } = await query.range(0, pageSize - 1)

      if (error) {
        console.error("[v0] Error searching documents:", error)
        throw error
      }

      setDocuments(docs || [])
      setTotalResults(count || (docs ? docs.length : 0))
    } catch (error) {
      console.error("[v0] Error in search:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreResults = async () => {
    if (isFetchingMore) return
    setIsFetchingMore(true)

    try {
      let query = supabase
        .from("documents")
        .select(
          `
          id, title, description, file_type, file_url,
          divisions!documents_division_id_fkey(name),
          departments!documents_department_id_fkey(name),
          secretaries!documents_secretary_id_fkey(name),
          executive_directors!documents_executive_director_id_fkey(name)
        `,
        )
        .eq("status", "classified")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
      if (selectedExecutiveDirector && selectedExecutiveDirector !== "all") {
        query = query.eq("executive_director_id", selectedExecutiveDirector)
      }
      if (selectedSecretary && selectedSecretary !== "all") {
        query = query.eq("secretary_id", selectedSecretary)
      }
      if (selectedDivision && selectedDivision !== "all") {
        query = query.eq("division_id", selectedDivision)
      }
      if (selectedDepartment && selectedDepartment !== "all") {
        query = query.eq("department_id", selectedDepartment)
      }

      const start = currentPage * pageSize
      const end = start + pageSize - 1
      const { data: docs, error } = await query.range(start, end)
      if (error) throw error

      setDocuments((prev) => [...prev, ...(docs || [])])
      setCurrentPage((p) => p + 1)
    } catch (error) {
      console.error("[v0] Error loading more results:", error)
    } finally {
      setIsFetchingMore(false)
    }
  }

  const handleReset = () => {
    setSearchQuery("")
    setSelectedExecutiveDirector("all")
    setSelectedSecretary("all")
    setSelectedDivision("all")
    setSelectedDepartment("all")
    setDocuments([])
    setHasSearched(false)
    setCurrentPage(1)
    setTotalResults(0)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Documents
          </CardTitle>
          <CardDescription>Filter documents by keywords and organizational hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Keyword Search */}
            <div className="grid gap-2">
              <Label htmlFor="search">Search by Title or Description</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Hierarchy Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="filter-ed">Executive Director</Label>
                <Select value={selectedExecutiveDirector} onValueChange={setSelectedExecutiveDirector}>
                  <SelectTrigger id="filter-ed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {executiveDirectors.map((ed) => (
                      <SelectItem key={ed.id} value={ed.id}>
                        {ed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filter-sec">Secretary</Label>
                <Select value={selectedSecretary} onValueChange={setSelectedSecretary}>
                  <SelectTrigger id="filter-sec">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {secretaries.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filter-div">Division</Label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger id="filter-div">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="filter-dept">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="filter-dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                {isLoading ? "Searching..." : "Search"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Showing {documents.length} of {totalResults} results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents found matching your criteria</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base leading-tight mb-1">{doc.title}</h3>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <span className="font-medium">{doc.executive_directors?.name}</span>
                                <span>→</span>
                                <span>{doc.secretaries?.name}</span>
                                <span>→</span>
                                <span>{doc.divisions?.name}</span>
                                <span>→</span>
                                <span>{doc.departments?.name}</span>
                              </div>
                              {doc.file_type && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                    {doc.file_type}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {documents.length < totalResults && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={loadMoreResults} disabled={isFetchingMore} variant="secondary">
                      {isFetchingMore ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
