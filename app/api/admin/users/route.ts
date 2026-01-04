import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - List all users
export async function GET() {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Use admin client to list users
        const adminClient = createAdminClient()
        const { data: { users }, error } = await adminClient.auth.admin.listUsers()

        if (error) {
            console.error("Error listing users:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Return simplified user data
        const simplifiedUsers = users.map((u) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            email_confirmed_at: u.email_confirmed_at,
        }))

        return NextResponse.json({ users: simplifiedUsers })
    } catch (error) {
        console.error("Error in GET /api/admin/users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        // Use admin client to create user
        const adminClient = createAdminClient()
        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email since we're setting password directly
        })

        if (error) {
            console.error("Error creating user:", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                created_at: data.user.created_at,
            },
        })
    } catch (error) {
        console.error("Error in POST /api/admin/users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
    try {
        // Verify the requester is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("id")

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
        }

        // Use admin client to delete user
        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.deleteUser(userId)

        if (error) {
            console.error("Error deleting user:", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error in DELETE /api/admin/users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
