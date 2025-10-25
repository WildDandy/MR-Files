"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Upload, FileText, FileSpreadsheet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BulkImportForm() {
  const [fileList, setFileList] = useState("")
  const [csvContent, setCsvContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [totalToImport, setTotalToImport] = useState(0)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const router = useRouter()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvContent(text)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = async () => {
    if (!csvContent.trim()) return

    console.log("[v0] Starting CSV import")
    setIsLoading(true)
    setImportedCount(0)
    setCurrentBatch(0)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in to import documents")
        setIsLoading(false)
        return
      }

      const lines = csvContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)

      console.log("[v0] Total lines:", lines.length)

      const dataLines = lines.slice(1)
      console.log("[v0] Data lines:", dataLines.length)

      const documents: any[] = []

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i]
        const parts = line.split(",").map((part) => part.trim().replace(/^["']|["']$/g, ""))

        if (parts.length >= 2) {
          const documentName = parts[0]
          const location = parts[1]

          documents.push({
            title: documentName,
            description: null,
            file_url: null,
            file_type: getFileType(documentName),
            status: "unclassified",
            classified_by: user.id,
            group_name: null,
            location: location,
          })
        }
      }

      console.log("[v0] Total documents to import:", documents.length)

      if (documents.length === 0) {
        alert("No valid documents found in CSV. Please check the format:\nDocument Name,Location")
        setIsLoading(false)
        return
      }

      setTotalToImport(documents.length)

      const batchSize = 500
      let totalImported = 0
      const totalBatches = Math.ceil(documents.length / batchSize)

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1

        setCurrentBatch(batchNumber)
        console.log("[v0] Importing batch", batchNumber, "of", totalBatches, ":", i, "to", i + batch.length)

        const { data, error } = await supabase.from("documents").insert(batch).select()

        if (error) {
          console.error("[v0] Batch import error at batch", batchNumber, ":", error)
          alert(
            `Import failed at batch ${batchNumber} of ${totalBatches}. ${totalImported} documents were imported successfully before the error.\n\nError: ${error.message}`,
          )
          setIsLoading(false)
          return
        }

        totalImported += data?.length || 0
        setImportedCount(totalImported)
        console.log("[v0] Imported so far:", totalImported, "of", documents.length)
      }

      console.log("[v0] Total imported:", totalImported)
      setCsvContent("")
      setSelectedFileName("")

      alert(`Successfully imported all ${totalImported} documents!`)
    } catch (error) {
      console.error("[v0] Error importing CSV:", error)
      alert(
        `Failed to import CSV: ${error instanceof Error ? error.message : "Unknown error"}\n\nImported ${importedCount} documents before error.`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!fileList.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in to import documents")
        setIsLoading(false)
        return
      }

      const documents = parseFileList(fileList, user.id)

      const batchSize = 500
      let totalImported = 0

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        const { data, error } = await supabase.from("documents").insert(batch).select()

        if (error) throw error
        totalImported += data?.length || 0
      }

      setImportedCount(totalImported)
      setFileList("")

      setTimeout(() => {
        router.push("/classify")
      }, 1500)
    } catch (error) {
      console.error("Error importing documents:", error)
      alert("Failed to import documents. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const parseFileList = (text: string, userId: string) => {
    const lines = text.split("\n").map((line) => line.trim())
    const documents: any[] = []
    let currentGroup: string | null = null

    for (const line of lines) {
      if (!line) continue

      if (line.startsWith("###") || line.startsWith("##") || line.endsWith("/")) {
        currentGroup = line
          .replace(/^#+\s*/, "")
          .replace(/\/$/, "")
          .replace(/^[\d_]+/, "")
          .trim()
        continue
      }

      const fileMatch = line.match(/`([^`]+)`/)
      const filename = fileMatch ? fileMatch[1] : line

      if (filename.includes(".") || fileMatch) {
        documents.push({
          title: filename,
          description: null,
          file_url: null,
          file_type: getFileType(filename),
          status: "unclassified",
          classified_by: userId,
          group_name: currentGroup,
        })
      }
    }

    return documents
  }

  const getFileType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const typeMap: Record<string, string> = {
      pdf: "PDF",
      doc: "Word",
      docx: "Word",
      xls: "Excel",
      xlsx: "Excel",
      txt: "Text",
      jpg: "Image",
      jpeg: "Image",
      png: "Image",
      gif: "Image",
      mp4: "Video",
      zip: "Archive",
      rar: "Archive",
    }
    return typeMap[ext || ""] || "Other"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Import Documents
        </CardTitle>
        <CardDescription>Import documents from a file list or CSV with document names and locations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <FileText className="h-4 w-4 mr-2" />
              File List
            </TabsTrigger>
            <TabsTrigger value="csv">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex flex-col gap-4 mt-4">
            <Textarea
              placeholder="### 2_OEC Vols/&#10;- `OEC+Index.doc` - Word document&#10;- `OEC+Subject+index.pdf` - PDF document&#10;&#10;### LRH Directory/&#10;- `1979_Scn_Materials_List.xls`&#10;- `Central_Office.pdf`"
              value={fileList}
              onChange={(e) => setFileList(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {fileList.split("\n").filter((line) => line.trim().length > 0).length} lines ready to import
                </span>
              </div>

              <Button onClick={handleImport} disabled={isLoading || !fileList.trim()}>
                {isLoading ? "Importing..." : "Import Documents"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="flex flex-col gap-4 mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              CSV format: Document Name, Location (with header row)
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("csv-file-input")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFileName || "Choose CSV File"}
                </Button>
                <input id="csv-file-input" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>

              <div className="text-sm text-muted-foreground text-center">or paste CSV content below</div>

              <Textarea
                placeholder="Document Name,Location&#10;OEC Index.doc,Maria's Computer&#10;OEC Subject index.pdf,Google Drive&#10;1979 Scn Materials List.xls,Server Room"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>
                  {Math.max(0, csvContent.split("\n").filter((line) => line.trim().length > 0).length - 1)} documents
                  ready to import
                </span>
              </div>

              <Button onClick={handleCsvImport} disabled={isLoading || !csvContent.trim()}>
                {isLoading ? "Importing..." : "Import CSV"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isLoading && totalToImport > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 text-sm mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Importing documents...</span>
              <span className="font-mono">
                {importedCount} / {totalToImport}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(importedCount / totalToImport) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-2 text-muted-foreground">
              Batch {currentBatch} of {Math.ceil(totalToImport / 500)} (500 documents per batch)
            </div>
          </div>
        )}

        {importedCount > 0 && !isLoading && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm mt-4">
            Successfully imported {importedCount} documents!
            <Button onClick={() => router.push("/classify")} variant="outline" size="sm" className="ml-4">
              Go to Classification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
