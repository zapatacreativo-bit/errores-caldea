import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function StatsWidget() {
    const [stats, setStats] = useState({
        totalIssues: 0,
        totalUrls: 0,
        fixedUrls: 0,
        pendingUrls: 0,
        highPriority: 0,
        completionRate: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            // Obtener estadísticas de issue_types
            const { data: issueTypes, error: issueError } = await supabase
                .from('issue_types')
                .select('*')

            if (issueError) throw issueError

            // Obtener estadísticas de audit_urls
            const { data: urls, error: urlsError } = await supabase
                .from('audit_urls')
                .select('status')

            if (urlsError) throw urlsError

            const totalUrls = urls?.length || 0
            const fixedUrls = urls?.filter(u => u.status === 'fixed').length || 0
            const pendingUrls = urls?.filter(u => u.status === 'pending').length || 0
            const highPriority = issueTypes?.filter(i => i.priority === 'High').length || 0
            const completionRate = totalUrls > 0 ? Math.round((fixedUrls / totalUrls) * 100) : 0

            setStats({
                totalIssues: issueTypes?.length || 0,
                totalUrls,
                fixedUrls,
                pendingUrls,
                highPriority,
                completionRate
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
                label="Tipos de Error"
                value={stats.totalIssues}
                icon="📋"
                color="blue"
            />
            <StatCard
                label="URLs Totales"
                value={stats.totalUrls.toLocaleString()}
                icon="🔗"
                color="gray"
            />
            <StatCard
                label="Corregidas"
                value={stats.fixedUrls.toLocaleString()}
                icon="✅"
                color="green"
            />
            <StatCard
                label="Pendientes"
                value={stats.pendingUrls.toLocaleString()}
                icon="⏳"
                color="yellow"
            />
            <StatCard
                label="Alta Prioridad"
                value={stats.highPriority}
                icon="🔴"
                color="red"
            />
            <StatCard
                label="Completado"
                value={`${stats.completionRate}%`}
                icon="📊"
                color="purple"
            />
        </div>
    )
}

function StatCard({ label, value, icon, color }) {
    const colorClasses = {
        blue: 'border-blue-500 bg-blue-50',
        gray: 'border-gray-500 bg-gray-50',
        green: 'border-green-500 bg-green-50',
        yellow: 'border-yellow-500 bg-yellow-50',
        red: 'border-red-500 bg-red-50',
        purple: 'border-purple-500 bg-purple-50'
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
        </div>
    )
}
