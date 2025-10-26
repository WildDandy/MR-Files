import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await supabase.from("admins").select("*").eq("id", user.id).single()

    if (!adminData) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Read the combined migration file
    const migrationsPath = path.join(process.cwd(), "run_migrations_combined.sql")
    const sql = fs.readFileSync(migrationsPath, "utf-8")

    // Split into individual statements and execute
    const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0)

    const results = []

    for (const statement of statements) {
      const trimmed = statement.trim()
      if (!trimmed) continue

      try {
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_string: trimmed,
        })

        if (error) {
          results.push({
            success: false,
            error: error.message,
            sql: trimmed.substring(0, 100),
          })
        } else {
          results.push({
            success: true,
            sql: trimmed.substring(0, 100),
          })
        }
      } catch (err) {
        results.push({
          success: false,
          error: String(err),
          sql: trimmed.substring(0, 100),
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
