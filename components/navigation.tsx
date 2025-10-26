"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Upload, Tags, Settings, HelpCircle, ChevronDown } from "lucide-react"

export function Navigation() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <nav className="border-b bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg hover:text-primary transition-colors">
              [SCNFILES]
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/classify">
                  <Tags className="h-4 w-4 mr-2" />
                  Classify
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tutorial">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Tutorial
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Definições
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/definicoes/complexidade">Complexidade</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/definicoes/feriados">Feriados</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/definicoes/armazens">Armazéns</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/definicoes/transportadores">Transportadores</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
