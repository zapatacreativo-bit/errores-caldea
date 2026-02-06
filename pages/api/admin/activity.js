// API Route: Activity Log
// Returns paginated activity log

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    if (!await isAdmin(authHeader)) {
        return res.status(403).json({ error: 'No autorizado' })
    }

    const { page = 1, limit = 50, user_email, action_type } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabaseAdmin
        .from('v_activity_dashboard')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)

    if (user_email) {
        query = query.ilike('user_email', `%${user_email}%`)
    }
    if (action_type && action_type !== 'all') {
        query = query.eq('action_type', action_type)
    }

    const { data, error, count } = await query

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit))
        }
    })
}
