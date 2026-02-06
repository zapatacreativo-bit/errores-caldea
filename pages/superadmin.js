import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
    Users, Activity, Shield, Trash2, Mail, Eye, EyeOff,
    ChevronLeft, ChevronRight, RefreshCw, UserX, UserCheck,
    Clock, CheckCircle, XCircle, RotateCcw
} from 'lucide-react'

export default function SuperAdmin() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')

    // Users state
    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(false)

    // Activity state
    const [activities, setActivities] = useState([])
    const [activityLoading, setActivityLoading] = useState(false)
    const [activityPage, setActivityPage] = useState(1)
    const [activityPagination, setActivityPagination] = useState({})
    const [activityFilter, setActivityFilter] = useState('all')

    // Check auth and role
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) {
                fetchUserProfile(session.user.id)
            } else {
                router.push('/')
            }
        })
    }, [])

    const fetchUserProfile = async (userId) => {
        console.log('Fetching profile for:', userId)

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        console.log('Profile data:', data, 'Error:', error)

        if (data && (data.role === 'superadmin' || data.role === 'admin')) {
            setUserProfile(data)
            setLoading(false)
        } else if (!data || error) {
            // Profile doesn't exist - try to create it with superadmin role
            // This is for first-time setup
            console.log('No profile found, attempting to create...')
            const { data: sessionData } = await supabase.auth.getSession()
            const email = sessionData?.session?.user?.email

            const { error: insertError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: userId,
                    email: email,
                    display_name: email?.split('@')[0],
                    role: 'superadmin'
                })

            if (!insertError) {
                // Retry fetching
                const { data: newData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (newData) {
                    setUserProfile(newData)
                    setLoading(false)
                    return
                }
            }
            console.log('Insert error:', insertError)
            alert('No tienes permisos de admin. Contacta al SuperAdmin.')
            router.push('/')
        } else {
            alert('Tu rol actual es: ' + data.role + '. Necesitas rol admin o superadmin.')
            router.push('/')
        }
    }

    // Fetch users
    const fetchUsers = async () => {
        setUsersLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            const data = await res.json()
            if (Array.isArray(data)) setUsers(data)
        } catch (err) {
            console.error('Error fetching users:', err)
        }
        setUsersLoading(false)
    }

    // Fetch activity
    const fetchActivity = async (page = 1) => {
        setActivityLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch(`/api/admin/activity?page=${page}&action_type=${activityFilter}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            const result = await res.json()
            setActivities(result.data || [])
            setActivityPagination(result.pagination || {})
        } catch (err) {
            console.error('Error fetching activity:', err)
        }
        setActivityLoading(false)
    }

    useEffect(() => {
        if (userProfile) {
            if (activeTab === 'users') fetchUsers()
            if (activeTab === 'activity') fetchActivity(1)
        }
    }, [userProfile, activeTab])

    useEffect(() => {
        if (activeTab === 'activity') fetchActivity(activityPage)
    }, [activityPage, activityFilter])

    // User actions
    const updateUserRole = async (userId, newRole) => {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId, role: newRole })
        })
        fetchUsers()
    }

    const deleteUser = async (userId, email) => {
        if (!confirm(`¿Eliminar usuario ${email}? Esta acción no se puede deshacer.`)) return
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId })
        })
        fetchUsers()
    }

    const sendPasswordReset = async (email) => {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ email })
        })
        if (res.ok) {
            alert(`Email de reset enviado a ${email}`)
        } else {
            alert('Error enviando email')
        }
    }

    const getRoleBadge = (role) => {
        const styles = {
            superadmin: 'bg-red-500/20 text-red-300 border-red-500/30',
            admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            user: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            guest: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
        const icons = { superadmin: '👑', admin: '🛡️', user: '👤', guest: '👁️' }
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border ${styles[role] || styles.user}`}>
                {icons[role]} {role?.toUpperCase()}
            </span>
        )
    }

    const getStatusBadge = (status) => {
        const styles = {
            online: 'bg-green-500/20 text-green-300',
            away: 'bg-yellow-500/20 text-yellow-300',
            offline: 'bg-gray-500/20 text-gray-400'
        }
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[status]}`}>
                <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                {status?.toUpperCase()}
            </span>
        )
    }

    const getActionIcon = (action) => {
        const icons = {
            check: <CheckCircle className="w-4 h-4 text-green-400" />,
            uncheck: <XCircle className="w-4 h-4 text-red-400" />,
            ignore: <EyeOff className="w-4 h-4 text-gray-400" />,
            reactivate: <RotateCcw className="w-4 h-4 text-blue-400" />
        }
        return icons[action] || <Activity className="w-4 h-4" />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>SuperAdmin - CALDEA SEO</title>
            </Head>
            <div className="min-h-screen bg-[#050505] text-white">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-red-500" />
                            <div>
                                <h1 className="text-xl font-bold">Panel SuperAdmin</h1>
                                <p className="text-xs text-gray-500">{userProfile?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                        >
                            ← Volver al Dashboard
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <Users className="w-4 h-4" /> Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'activity' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <Activity className="w-4 h-4" /> Bitácora
                        </button>
                    </div>

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-lg font-bold">Usuarios Registrados ({users.length})</h2>
                                <button onClick={fetchUsers} disabled={usersLoading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">Usuario</th>
                                            <th className="px-4 py-3">Rol</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Última Conexión</th>
                                            <th className="px-4 py-3">Acciones</th>
                                            <th className="px-4 py-3">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">{user.display_name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                        className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="guest">👁️ Guest</option>
                                                        <option value="user">👤 User</option>
                                                        <option value="admin">🛡️ Admin</option>
                                                        <option value="superadmin">👑 SuperAdmin</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">{getStatusBadge(user.connection_status)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {user.last_seen_at ? new Date(user.last_seen_at).toLocaleString('es-ES') : 'Nunca'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="text-blue-400">{user.total_checks || 0}</span>
                                                    <span className="text-gray-600"> / {user.total_actions || 0}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => sendPasswordReset(user.email)}
                                                            className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400"
                                                            title="Enviar reset password"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(user.id, user.email)}
                                                            className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                                                            title="Eliminar usuario"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    Cuaderno de Bitácoras
                                </h2>
                                <div className="flex gap-2">
                                    {['all', 'check', 'uncheck', 'ignore', 'reactivate'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setActivityFilter(type); setActivityPage(1); }}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${activityFilter === type ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}
                                        >
                                            {type === 'all' ? 'Todos' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Hora</th>
                                            <th className="px-4 py-3">Usuario</th>
                                            <th className="px-4 py-3">Acción</th>
                                            <th className="px-4 py-3">URL</th>
                                            <th className="px-4 py-3">Tipo Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activityLoading ? (
                                            <tr><td colSpan="6" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                        ) : activities.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay actividad registrada</td></tr>
                                        ) : activities.map(act => (
                                            <tr key={act.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-sm">{act.fecha}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400">{act.hora}</td>
                                                <td className="px-4 py-3 text-sm text-blue-300">{act.user_email?.split('@')[0]}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1">
                                                        {getActionIcon(act.action_type)}
                                                        <span className="text-xs uppercase">{act.action_type}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{act.target_url}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{act.issue_type_title || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="p-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    Página {activityPagination.page} de {activityPagination.totalPages} ({activityPagination.total} registros)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                        disabled={activityPage === 1}
                                        className="p-2 bg-white/5 rounded-lg disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setActivityPage(p => Math.min(activityPagination.totalPages, p + 1))}
                                        disabled={activityPage >= activityPagination.totalPages}
                                        className="p-2 bg-white/5 rounded-lg disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
