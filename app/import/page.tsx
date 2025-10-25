import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { BulkImportForm } from "@/components/bulk-import-form"

export default async function ImportPage() {
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
      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center p-6 bg-muted/30">
        <div className="w-full max-w-[1600px] flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Import Documents</h1>
            <p className="text-muted-foreground mt-2">
              Paste your document filenames to import them for classification
            </p>
          </div>
          <BulkImportForm />
        </div>
      </main>
    </>
  )
}
