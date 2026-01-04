import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Fetches all records from a table by handling Supabase pagination.
 * @param client Supabase client (should be admin client to bypass RLS)
 * @param table Table name
 * @returns Array of all records
 */
export async function fetchAllRecords(client: SupabaseClient, table: string) {
    let allData: any[] = []
    let from = 0
    const pageSize = 1000

    while (true) {
        const { data, error } = await client
            .from(table)
            .select("*")
            .range(from, from + pageSize - 1)
            .order("id", { ascending: true })

        if (error) {
            console.error(`Error fetching all records from ${table}:`, error)
            throw error
        }

        if (!data || data.length === 0) {
            break
        }

        allData = [...allData, ...data]

        if (data.length < pageSize) {
            break
        }

        from += pageSize
    }

    return allData
}
