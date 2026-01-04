import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Export all data as JSON backup
export async function GET() {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Fetch all tables that need to be backed up
        const [
            { data: documents, error: documentsError },
            { data: divisions, error: divisionsError },
            { data: departments, error: departmentsError },
            { data: documentTypes, error: documentTypesError },
            { data: folders, error: foldersError },
            { data: locations, error: locationsError },
        ] = await Promise.all([
            adminClient.from("documents").select("*"),
            adminClient.from("divisions").select("*"),
            adminClient.from("departments").select("*"),
            adminClient.from("document_types").select("*"),
            adminClient.from("folders").select("*"),
            adminClient.from("locations").select("*"),
        ])

        // Check for errors
        const errors = [
            documentsError && `documents: ${documentsError.message}`,
            divisionsError && `divisions: ${divisionsError.message}`,
            departmentsError && `departments: ${departmentsError.message}`,
            documentTypesError && `document_types: ${documentTypesError.message}`,
            foldersError && `folders: ${foldersError.message}`,
            locationsError && `locations: ${locationsError.message}`,
        ].filter(Boolean)

        if (errors.length > 0) {
            console.error("Backup errors:", errors)
            return NextResponse.json({ error: `Failed to export some tables: ${errors.join(", ")}` }, { status: 500 })
        }

        const backup = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            exportedBy: user.email,
            data: {
                documents: documents || [],
                divisions: divisions || [],
                departments: departments || [],
                document_types: documentTypes || [],
                folders: folders || [],
                locations: locations || [],
            },
            counts: {
                documents: documents?.length || 0,
                divisions: divisions?.length || 0,
                departments: departments?.length || 0,
                document_types: documentTypes?.length || 0,
                folders: folders?.length || 0,
                locations: locations?.length || 0,
            },
        }

        return NextResponse.json(backup)
    } catch (error) {
        console.error("Error in GET /api/admin/backup:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Import data from JSON backup
export async function POST(request: NextRequest) {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { data, mode = "merge" } = body // mode: "merge" or "replace"

        if (!data) {
            return NextResponse.json({ error: "No backup data provided" }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const results: Record<string, { inserted: number; errors: string[] }> = {}

        // If replace mode, delete existing data first (in reverse order of dependencies)
        if (mode === "replace") {
            await adminClient.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000")
            await adminClient.from("folders").delete().neq("id", "00000000-0000-0000-0000-000000000000")
            await adminClient.from("departments").delete().neq("id", "00000000-0000-0000-0000-000000000000")
            await adminClient.from("divisions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
            await adminClient.from("document_types").delete().neq("id", "00000000-0000-0000-0000-000000000000")
            await adminClient.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        }

        // Import in order of dependencies
        const importOrder = ["locations", "document_types", "divisions", "departments", "folders", "documents"]

        for (const tableName of importOrder) {
            const tableData = data[tableName]
            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
                results[tableName] = { inserted: 0, errors: [] }
                continue
            }

            const errors: string[] = []
            let inserted = 0

            // Import in batches of 100
            const batchSize = 100
            for (let i = 0; i < tableData.length; i += batchSize) {
                const batch = tableData.slice(i, i + batchSize)

                const { error } = await adminClient
                    .from(tableName)
                    .upsert(batch, { onConflict: "id", ignoreDuplicates: mode === "merge" })

                if (error) {
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
                } else {
                    inserted += batch.length
                }
            }

            results[tableName] = { inserted, errors }
        }

        return NextResponse.json({
            success: true,
            mode,
            importedAt: new Date().toISOString(),
            importedBy: user.email,
            results,
        })
    } catch (error) {
        console.error("Error in POST /api/admin/backup:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
