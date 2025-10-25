import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminInterface } from "@/components/admin-interface"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch document types
  const { data: documentTypes } = await supabase.from("document_types").select("*").order("name")

  // Fetch organizational structure
  const { data: executiveDirectors } = await supabase
    .from("executive_directors")
    .select(
      `
      *,
      secretaries (
        *,
        divisions (
          *,
          departments (*)
        )
      )
    `,
    )
    .order("name")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <Link href="/classify">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <X className="h-4 w-4" />
              Close
            </Button>
          </Link>
        </div>
        <AdminInterface documentTypes={documentTypes || []} organizationalStructure={executiveDirectors || []} />
      </div>
    </div>
  )
}
