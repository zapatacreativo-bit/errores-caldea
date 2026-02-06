// API Route: Password Reset
// Sends password reset email to user

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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    if (!await isAdmin(authHeader)) {
        return res.status(403).json({ error: 'No autorizado' })
    }

    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Email requerido' })
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
    })

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, message: 'Email de reset enviado' })
}
