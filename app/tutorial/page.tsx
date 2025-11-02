import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { TutorialContent } from "@/components/tutorial-content"

export default async function TutorialPage() {
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
          <TutorialContent />
        </div>
      </main>
    </>
  )
}
