"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { ExecutiveDirector, Secretary, Division, Department } from "@/lib/types"

export function DocumentClassificationForm() {
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [fileType, setFileType] = useState("")

  // Hierarchy state
  const [executiveDirectors, setExecutiveDirectors] = useState<ExecutiveDirector[]>([])
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Selected values
  const [selectedExecutiveDirector, setSelectedExecutiveDirector] = useState("")
  const [selectedSecretary, setSelectedSecretary] = useState("")
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load executive directors on mount
  useEffect(() => {
    loadExecutiveDirectors()
  }, [])

  // Load secretaries when executive director changes
  useEffect(() => {
    if (selectedExecutiveDirector) {
      loadSecretaries(selectedExecutiveDirector)
      setSelectedSecretary("")
      setSelectedDivision("")
      setSelectedDepartment("")
    }
  }, [selectedExecutiveDirector])

  // Load divisions when secretary changes
  useEffect(() => {
    if (selectedSecretary) {
      loadDivisions(selectedSecretary)
      setSelectedDivision("")
      setSelectedDepartment("")
    }
  }, [selectedSecretary])

  // Load departments when division changes
  useEffect(() => {
    if (selectedDivision) {
      loadDepartments(selectedDivision)
      setSelectedDepartment("")
    }
  }, [selectedDivision])

  const loadExecutiveDirectors = async () => {
    const { data, error } = await supabase.from("executive_directors").select("*").order("name")

    if (error) {
      console.error("Error loading executive directors:", error)
      return
    }

    setExecutiveDirectors(data || [])
  }

  const loadSecretaries = async (executiveDirectorId: string) => {
    const { data, error } = await supabase
      .from("secretaries")
      .select("*")
      .eq("executive_director_id", executiveDirectorId)
      .order("name")

    if (error) {
      console.error("Error loading secretaries:", error)
      return
    }

    setSecretaries(data || [])
  }

  const loadDivisions = async (secretaryId: string) => {
    const { data, error } = await supabase.from("divisions").select("*").eq("secretary_id", secretaryId).order("name")

    if (error) {
      console.error("Error loading divisions:", error)
      return
    }

    setDivisions(data || [])
  }

  const loadDepartments = async (divisionId: string) => {
    const { data, error } = await supabase.from("departments").select("*").eq("division_id", divisionId).order("name")

    if (error) {
      console.error("Error loading departments:", error)
      return
    }

    setDepartments(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to classify documents")
      }

      // Insert document
      const { error: insertError } = await supabase.from("documents").insert({
        title,
        description: description || null,
        file_url: fileUrl,
        file_type: fileType || null,
        executive_director_id: selectedExecutiveDirector,
        secretary_id: selectedSecretary,
        division_id: selectedDivision,
        department_id: selectedDepartment,
        classified_by: user.id,
      })

      if (insertError) throw insertError

      setSuccess(true)

      // Reset form
      setTitle("")
      setDescription("")
      setFileUrl("")
      setFileType("")
      setSelectedExecutiveDirector("")
      setSelectedSecretary("")
      setSelectedDivision("")
      setSelectedDepartment("")

      // Redirect to search page after 2 seconds
      setTimeout(() => {
        router.push("/search")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Classify Document</CardTitle>
        <CardDescription>Add a new document to the organizational hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Document Information */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter document description (optional)"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileType">File Type</Label>
              <Input
                id="fileType"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                placeholder="PDF, DOCX, etc. (optional)"
              />
            </div>
          </div>

          {/* Organizational Hierarchy */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-sm">Organizational Classification *</h3>

            <div className="grid gap-2">
              <Label htmlFor="executiveDirector">Executive Director</Label>
              <Select value={selectedExecutiveDirector} onValueChange={setSelectedExecutiveDirector} required>
                <SelectTrigger id="executiveDirector">
                  <SelectValue placeholder="Select Executive Director" />
                </SelectTrigger>
                <SelectContent>
                  {executiveDirectors.map((ed) => (
                    <SelectItem key={ed.id} value={ed.id}>
                      {ed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="secretary">Secretary</Label>
              <Select
                value={selectedSecretary}
                onValueChange={setSelectedSecretary}
                disabled={!selectedExecutiveDirector}
                required
              >
                <SelectTrigger id="secretary">
                  <SelectValue placeholder="Select Secretary" />
                </SelectTrigger>
                <SelectContent>
                  {secretaries.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="division">Division</Label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
                disabled={!selectedSecretary}
                required
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.id}>
                      {div.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={!selectedDivision}
                required
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              Document classified successfully! Redirecting to search...
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Classifying..." : "Classify Document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
