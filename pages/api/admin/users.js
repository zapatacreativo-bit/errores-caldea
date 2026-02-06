// API Route: Admin Users Management
// Requires SuperAdmin or Admin role

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin client (with service role key)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // This must be in .env.local
)

// Helper to check if user is admin
async function isAdmin(authHeader) {
    if (!authHeader) return false

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) return false

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role === 'superadmin' || profile?.role === 'admin'
}

export default async function handler(req, res) {
    const authHeader = req.headers.authorization

    if (!await isAdmin(authHeader)) {
        return res.status(403).json({ error: 'No autorizado' })
    }

    // GET: List all users
    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('v_users_admin')
            .select('*')

        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.status(200).json(data)
    }

    // PATCH: Update user role/status
    if (req.method === 'PATCH') {
        const { userId, role, is_active } = req.body

        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' })
        }

        const updateData = {}
        if (role !== undefined) updateData.role = role
        if (is_active !== undefined) updateData.is_active = is_active
        updateData.updated_at = new Date().toISOString()

        const { error } = await supabaseAdmin
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId)

        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.status(200).json({ success: true })
    }

    // DELETE: Remove user
    if (req.method === 'DELETE') {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' })
        }

        // Delete from auth.users (cascades to user_profiles)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
