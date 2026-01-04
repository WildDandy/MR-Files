import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// This endpoint is called by Vercel Cron
// Configure in vercel.json with: "crons": [{ "path": "/api/cron/backup", "schedule": "0 3 * * 0" }]
// This runs every Sunday at 3:00 AM UTC

export async function GET(request: Request) {
    try {
        // Verify the request is from Vercel Cron (in production)
        const authHeader = request.headers.get("authorization")
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
            exportedBy: "cron-job",
            type: "automatic",
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

        // Generate filename with date
        const date = new Date().toISOString().split("T")[0]
        const filename = `backups/auto-backup-${date}.json`

        // Upload to Supabase Storage
        const { error: uploadError } = await adminClient.storage
            .from("backups")
            .upload(filename, JSON.stringify(backup, null, 2), {
                contentType: "application/json",
                upsert: true, // Overwrite if exists (same day)
            })

        if (uploadError) {
            // If bucket doesn't exist, try to create it
            if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
                const { error: createBucketError } = await adminClient.storage.createBucket("backups", {
                    public: false,
                })

                if (createBucketError && !createBucketError.message.includes("already exists")) {
                    console.error("Failed to create bucket:", createBucketError)
                    return NextResponse.json({ error: `Failed to create storage bucket: ${createBucketError.message}` }, { status: 500 })
                }

                // Try upload again
                const { error: retryError } = await adminClient.storage
                    .from("backups")
                    .upload(filename, JSON.stringify(backup, null, 2), {
                        contentType: "application/json",
                        upsert: true,
                    })

                if (retryError) {
                    console.error("Failed to upload backup:", retryError)
                    return NextResponse.json({ error: `Failed to upload backup: ${retryError.message}` }, { status: 500 })
                }
            } else {
                console.error("Failed to upload backup:", uploadError)
                return NextResponse.json({ error: `Failed to upload backup: ${uploadError.message}` }, { status: 500 })
            }
        }

        // Clean up old backups (keep last 4 weeks)
        const { data: files } = await adminClient.storage.from("backups").list("", {
            sortBy: { column: "created_at", order: "desc" },
        })

        if (files && files.length > 4) {
            const filesToDelete = files.slice(4).map((f) => f.name)
            await adminClient.storage.from("backups").remove(filesToDelete)
        }

        console.log(`Automatic backup completed: ${filename}`)

        return NextResponse.json({
            success: true,
            filename,
            counts: backup.counts,
            timestamp: backup.exportedAt,
        })
    } catch (error) {
        console.error("Error in cron backup:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
