import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Upload, Tags, Search, FileText } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { count: unclassifiedCount, error: unclassifiedError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "unclassified")

  if (unclassifiedError) {
    console.error("[v0] Error fetching unclassified count:", unclassifiedError)
  }

  const { count: classifiedCount, error: classifiedError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "classified")

  if (classifiedError) {
    console.error("[v0] Error fetching classified count:", classifiedError)
  }

  return (
    <>
      <Navigation />
      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-[1600px] flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Document Classification System</h1>
            <p className="text-muted-foreground mt-2">Fast bulk classification for your organizational documents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5" />
                  1. Import
                </CardTitle>
                <CardDescription>Paste your document filenames to import them</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/import">Import Documents</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tags className="h-5 w-5" />
                  2. Classify
                </CardTitle>
                <CardDescription>Quickly assign categories to documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/classify">
                    Classify Documents
                    {unclassifiedCount ? (
                      <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                        {unclassifiedCount}
                      </span>
                    ) : null}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5" />
                  3. Search
                </CardTitle>
                <CardDescription>Find and browse classified documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/search">Search Documents</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">{unclassifiedCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unclassified</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{classifiedCount || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Classified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
