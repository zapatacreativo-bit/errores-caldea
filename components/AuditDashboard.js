import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function AuditDashboard() {
    const [issues, setIssues] = useState([])
    const [stats, setStats] = useState({
        high: 0,
        medium: 0,
        low: 0,
        totalUrls: 0,
        fixedUrls: 0
    })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, High, Medium, Low

    useEffect(() => {
        fetchIssues()
    }, [])

    async function fetchIssues() {
        try {
            // Obtener tipos de error con estadísticas
            const { data, error } = await supabase
                .from('v_issue_stats')
                .select('*')

            if (error) throw error

            setIssues(data || [])

            // Calcular estadísticas
            const highCount = data?.filter(i => i.priority === 'High').length || 0
            const mediumCount = data?.filter(i => i.priority === 'Medium').length || 0
            const lowCount = data?.filter(i => i.priority === 'Low').length || 0
            const totalUrls = data?.reduce((sum, i) => sum + (i.total_count || 0), 0) || 0
            const fixedUrls = data?.reduce((sum, i) => sum + (i.fixed_count || 0), 0) || 0

            setStats({
                high: highCount,
                medium: mediumCount,
                low: lowCount,
                totalUrls,
                fixedUrls
            })
        } catch (error) {
            console.error('Error fetching issues:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredIssues = filter === 'all'
        ? issues
        : issues.filter(i => i.priority === filter)

    const completionPercentage = stats.totalUrls > 0
        ? Math.round((stats.fixedUrls / stats.totalUrls) * 100)
        : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando datos de auditoría...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Auditoría SEO Caldea.com</h1>
                <p className="text-gray-600">Dashboard de seguimiento y corrección de errores</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
                    <h2 className="text-gray-500 text-sm uppercase font-semibold mb-1">Prioridad Alta</h2>
                    <p className="text-3xl font-bold text-gray-800">{stats.high}</p>
                    <p className="text-xs text-gray-500 mt-1">Tipos de error críticos</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                    <h2 className="text-gray-500 text-sm uppercase font-semibold mb-1">Prioridad Media</h2>
                    <p className="text-3xl font-bold text-gray-800">{stats.medium}</p>
                    <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <h2 className="text-gray-500 text-sm uppercase font-semibold mb-1">Prioridad Baja</h2>
                    <p className="text-3xl font-bold text-gray-800">{stats.low}</p>
                    <p className="text-xs text-gray-500 mt-1">Optimizaciones menores</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
                    <h2 className="text-gray-500 text-sm uppercase font-semibold mb-1">Progreso Global</h2>
                    <p className="text-3xl font-bold text-gray-800">{completionPercentage}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stats.fixedUrls} de {stats.totalUrls} corregidos</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">Filtrar por prioridad:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({issues.length})
                        </button>
                        <button
                            onClick={() => setFilter('High')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'High'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Alta ({stats.high})
                        </button>
                        <button
                            onClick={() => setFilter('Medium')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'Medium'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Media ({stats.medium})
                        </button>
                        <button
                            onClick={() => setFilter('Low')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'Low'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Baja ({stats.low})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla Maestra */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
                            <th className="px-5 py-3 text-left font-semibold">Tipo de Error</th>
                            <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                            <th className="px-5 py-3 text-left font-semibold">Prioridad</th>
                            <th className="px-5 py-3 text-left font-semibold">Total</th>
                            <th className="px-5 py-3 text-left font-semibold">Corregidos</th>
                            <th className="px-5 py-3 text-left font-semibold">Progreso</th>
                            <th className="px-5 py-3 text-left font-semibold">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {filteredIssues.map((issue) => {
                            const progress = issue.total_count > 0
                                ? Math.round((issue.fixed_count / issue.total_count) * 100)
                                : 0

                            return (
                                <tr key={issue.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-5 text-left">
                                        <span className="font-medium text-gray-900">{issue.title}</span>
                                        <p className="text-gray-500 text-xs mt-1 max-w-md">{issue.description}</p>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <span className="text-gray-700">{issue.category_name}</span>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {issue.priority === 'High' ? 'Alta' : issue.priority === 'Medium' ? 'Media' : 'Baja'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <span className="font-bold text-gray-800">{issue.total_count}</span>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <span className="text-green-600 font-semibold">{issue.fixed_count}</span>
                                        <span className="text-gray-400 text-xs ml-1">/ {issue.pending_count} pendientes</span>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-600 font-medium">{progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-left">
                                        <Link
                                            href={`/fix/${issue.id}`}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-semibold text-sm transition-colors"
                                        >
                                            Reparar
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredIssues.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No se encontraron errores con este filtro.
                    </div>
                )}
            </div>
        </div>
    )
}
