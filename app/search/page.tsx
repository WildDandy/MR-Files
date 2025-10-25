import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentSearch } from "@/components/document-search"
import { Navigation } from "@/components/navigation"

export default async function SearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <>
      <Navigation />
      <main className="flex min-h-[calc(100vh-73px)] flex-col p-6 bg-muted/30">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Search</h1>
            <p className="text-muted-foreground mt-1">Find and access classified documents</p>
          </div>
          <DocumentSearch />
        </div>
      </main>
    </>
  )
}
