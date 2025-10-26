import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { ClassificationInterface } from "@/components/classification-interface"

export default async function ClassifyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // No server-side documents fetch; client paginates within ClassificationInterface.

  const { data: executiveDirectors, error: edError } = await supabase
    .from("executive_directors")
    .select("id, name")
    .order("name")

  const { data: secretaries, error: secError } = await supabase
    .from("secretaries")
    .select("id, name, executive_director_id")
    .order("name")

  const { data: divisions, error: divError } = await supabase
    .from("divisions")
    .select("id, name, secretary_id")
    .order("name")

  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, name, division_id")
    .order("name")

  // Fetch folders for filtering with document counts from materialized view
  const { data: folders, error: foldersError } = await supabase
    .from("folders")
    .select(`
      id,
      name,
      full_path,
      level,
      parent_id,
      folder_document_counts(document_count)
    `)
    .order("full_path")
    .limit(10000)

  if (edError || secError || divError || deptError) {
    console.error("[v0] Error fetching organizational structure:", { edError, secError, divError, deptError })
  }

  if (foldersError) {
    console.error("[v0] Error fetching folders:", foldersError)
  }

  // Build the hierarchical structure manually
  const organizationalStructure = (executiveDirectors || []).map((ed) => ({
    ...ed,
    secretaries: (secretaries || [])
      .filter((sec) => sec.executive_director_id === ed.id)
      .map((sec) => ({
        ...sec,
        divisions: (divisions || [])
          .filter((div) => div.secretary_id === sec.id)
          .map((div) => ({
            ...div,
            departments: (departments || []).filter((dept) => dept.division_id === div.id),
          })),
      })),
  }))

  // Extract document counts from the nested folder_document_counts array
  const folderDocumentCounts: Record<string, number> = {}
  const processedFolders = (folders || []).map((folder: any) => {
    const counts = folder.folder_document_counts
    if (Array.isArray(counts) && counts.length > 0) {
      folderDocumentCounts[folder.id] = counts[0].document_count || 0
    } else if (counts && typeof counts === 'object') {
      folderDocumentCounts[folder.id] = counts.document_count || 0
    } else {
      folderDocumentCounts[folder.id] = 0
    }
    return {
      id: folder.id,
      name: folder.name,
      full_path: folder.full_path,
      level: folder.level,
      parent_id: folder.parent_id,
    }
  })

  return (
    <>
      <Navigation />
      <main className="min-h-[calc(100vh-73px)] p-6 bg-muted/30">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Classify Documents</h1>
            <p className="text-muted-foreground mt-2">
              Select a document and click the appropriate category to classify it
            </p>
          </div>
          <ClassificationInterface
            organizationalStructure={organizationalStructure}
            folders={processedFolders}
            documentCounts={folderDocumentCounts}
          />
        </div>
      </main>
    </>
  )
}
