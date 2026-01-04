import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminClient = createAdminClient()
        const { fetchAllRecords } = await import("@/lib/supabase/utils")

        // Fetch all tables that need to be backed up (handling pagination)
        const [
            documents,
            divisions,
            departments,
            documentTypes,
            folders,
            locations,
        ] = await Promise.all([
            fetchAllRecords(adminClient, "documents"),
            fetchAllRecords(adminClient, "divisions"),
            fetchAllRecords(adminClient, "departments"),
            fetchAllRecords(adminClient, "document_types"),
            fetchAllRecords(adminClient, "folders"),
            fetchAllRecords(adminClient, "locations"),
        ])

        const backup = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            exportedBy: user.email,
            type: "manual-cloud",
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

        // Generate filename with date - use .gz for compressed files
        const date = new Date().toISOString().split("T")[0]
        const filename = `manual-backup-${date}-${Date.now()}.json.gz`

        // Compress the backup to save space
        const { gzipSync } = await import("zlib")
        const compressedBackup = gzipSync(JSON.stringify(backup))

        // Upload to Supabase Storage
        const { error: uploadError } = await adminClient.storage
            .from("backups")
            .upload(filename, compressedBackup, {
                contentType: "application/gzip",
                upsert: true,
            })

        if (uploadError) {
            // Bucket creation logic (simplified)
            if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
                await adminClient.storage.createBucket("backups", { public: false })
                const { error: retryError } = await adminClient.storage
                    .from("backups")
                    .upload(filename, compressedBackup, {
                        contentType: "application/gzip",
                        upsert: true,
                    })
                if (retryError) throw retryError
            } else {
                throw uploadError
            }
        }

        // Clean up manual backups - keep only the last 2 manual cloud backups to save space
        const { data: files } = await adminClient.storage.from("backups").list("", {
            sortBy: { column: "created_at", order: "desc" },
        })

        if (files) {
            const manualBackups = files
                .filter(f => f.name.startsWith("manual-backup-") && f.name.endsWith(".json.gz"))
                .sort((a, b) => b.name.localeCompare(a.name))

            if (manualBackups.length > 2) {
                const filesToDelete = manualBackups.slice(2).map((f) => f.name)
                await adminClient.storage.from("backups").remove(filesToDelete)
            }
        }

        return NextResponse.json({
            success: true,
            filename,
            counts: backup.counts,
        })
    } catch (error: any) {
        console.error("Error in POST /api/admin/backup/cloud:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
