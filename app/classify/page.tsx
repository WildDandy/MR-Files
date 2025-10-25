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

  // Fetch unclassified documents
  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select("*")
    .eq("status", "unclassified")
    .order("created_at", { ascending: true })

  if (docsError) {
    console.error("[v0] Error fetching documents:", docsError)
  }

  const { data: executiveDirectors, error: edError } = await supabase
    .from("executive_directors")
    .select("*")
    .order("name")

  const { data: secretaries, error: secError } = await supabase.from("secretaries").select("*").order("name")

  const { data: divisions, error: divError } = await supabase.from("divisions").select("*").order("name")

  const { data: departments, error: deptError } = await supabase.from("departments").select("*").order("name")

  if (edError || secError || divError || deptError) {
    console.error("[v0] Error fetching organizational structure:", { edError, secError, divError, deptError })
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
          <ClassificationInterface documents={documents || []} organizationalStructure={organizationalStructure} />
        </div>
      </main>
    </>
  )
}
