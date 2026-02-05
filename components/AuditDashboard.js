import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import GlassCard from './ui/GlassCard'
import OnlineUsers from './OnlineUsers'
import ChatWidget from './ChatWidget' // Import ChatWidget
import { getRandomQuote } from '../lib/quotes'
import { Activity, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'

export default function AuditDashboard({ session }) {

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
    const [quote, setQuote] = useState("Cargando dosis de realidad...")

    useEffect(() => {
        fetchIssues()
        setQuote(getRandomQuote())
    }, [])

    // ... fetchIssues logic remains ...

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
        <div className="container mx-auto p-6 min-h-screen text-gray-100">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-6 flex-col md:flex-row">
                    {/* Partner Logo */}
                    {/* Partner Logo - Transparent & Larger */}
                    <div className="relative group py-2">
                        <div className="absolute inset-0 bg-red-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                        <img
                            src="/logo-seo-madrid.png"
                            alt="SEO MADRID"
                            className="relative h-28 w-auto object-contain transition-all duration-300 transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">Auditoría SEO Caldea<span className="text-blue-400">.com</span></h1>
                        <p className="text-gray-400 font-medium">Dashboard de seguimiento y corrección de errores</p>
                    </div>
                    {/* Real-Time Users Widget */}
                    <div className="hidden md:block">
                        <OnlineUsers session={session} />
                    </div>
                </div>

                {/* Motivation Widget */}
                <div className="hidden md:block max-w-md">
                    <p className="text-sm text-right text-gray-300 italic font-mono opacity-90 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 shadow-inner">
                        "{quote}"
                        <br />
                        <span className="text-blue-400 font-semibold not-italic text-xs mt-1 block tracking-wide">
                            Consejo de Sabios...🎲
                        </span>
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <GlassCard
                    title="Prioridad Alta"
                    icon={AlertOctagon}
                    className="border-l-4 border-l-red-500 bg-red-500/5"
                    delay={0.1}
                    backContent={
                        <div className="text-center">
                            <h4 className="text-xl font-black text-red-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">¡ESTO ES ESPARTA!</h4>
                            <p className="text-sm text-gray-300 font-medium">Sin piedad con los errores críticos.</p>
                        </div>
                    }
                >
                    <p className="text-4xl font-bold text-white mt-2 drop-shadow-lg">{stats.high}</p>
                    <p className="text-sm text-red-200/70 mt-1 font-medium">Críticos</p>
                </GlassCard>

                <GlassCard
                    title="Prioridad Media"
                    icon={AlertTriangle}
                    className="border-l-4 border-l-yellow-500 bg-yellow-500/5"
                    delay={0.2}
                    backContent={
                        <div className="text-center">
                            <h4 className="text-xl font-black text-yellow-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">¡HOLD!</h4>
                            <p className="text-sm text-gray-300 font-medium">Mantén la línea, corrígelos todos.</p>
                        </div>
                    }
                >
                    <p className="text-4xl font-bold text-white mt-2 drop-shadow-lg">{stats.medium}</p>
                    <p className="text-sm text-yellow-200/70 mt-1 font-medium">Advertencias</p>
                </GlassCard>

                <GlassCard
                    title="Prioridad Baja"
                    icon={Activity}
                    className="border-l-4 border-l-blue-500 bg-blue-500/5"
                    delay={0.3}
                    backContent={
                        <div className="text-center">
                            <h4 className="text-xl font-black text-blue-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">¡SIN DESCANSO!</h4>
                            <p className="text-sm text-gray-300 font-medium">La perfección está en los detalles.</p>
                        </div>
                    }
                >
                    <p className="text-4xl font-bold text-white mt-2 drop-shadow-lg">{stats.low}</p>
                    <p className="text-sm text-blue-200/70 mt-1 font-medium">Mejoras</p>
                </GlassCard>

                <GlassCard
                    title="Progreso Global"
                    icon={CheckCircle}
                    className="border-l-4 border-l-green-500 bg-green-500/5"
                    delay={0.4}
                    backContent={
                        <div className="text-center">
                            <h4 className="text-xl font-black text-green-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">¡VICTORIA!</h4>
                            <p className="text-sm text-gray-300 font-medium">Solo aceptamos el 100%.</p>
                        </div>
                    }
                >
                    <div className="flex items-end gap-2 mt-2">
                        <p className="text-4xl font-bold text-white drop-shadow-lg">{completionPercentage}%</p>
                        <span className="text-xs text-green-200/70 mb-2 font-medium">Completado</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-4 overflow-hidden border border-white/5">
                        <div
                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </GlassCard>
            </div>

            {/* Filtros */}
            <GlassCard className="mb-6 py-4 px-6 flex flex-wrap items-center gap-4 bg-black/40 backdrop-blur-3xl">
                <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">Filtrar:</span>
                <div className="flex gap-2">
                    {['all', 'High', 'Medium', 'Low'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`mx-2 first:ml-0 last:mr-0 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-md ${filter === f
                                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                                }`}
                        >
                            {f === 'all' ? `Todos (${issues.length})` :
                                f === 'High' ? `Alta (${stats.high})` :
                                    f === 'Medium' ? `Media (${stats.medium})` :
                                        `Baja (${stats.low})`}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Tabla Maestra */}
            <div className="rounded-2xl border border-white/10 overflow-auto max-h-[75vh] bg-[#0A0A0A]/90 backdrop-blur-xl shadow-2xl custom-scrollbar">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="sticky top-0 z-20 bg-black text-gray-300 uppercase text-xs leading-normal border-b border-white/10 shadow-lg">
                            <th className="px-6 py-5 text-left font-bold tracking-wider text-blue-400/80">Tipo de Error</th>
                            <th className="px-6 py-5 text-left font-bold tracking-wider text-blue-400/80">Categoría</th>
                            <th className="px-6 py-5 text-left font-bold tracking-wider text-blue-400/80">Prioridad</th>
                            <th className="px-6 py-5 text-left font-bold tracking-wider text-blue-400/80">Estado</th>
                            <th className="px-6 py-5 text-left font-bold tracking-wider text-blue-400/80">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 text-sm">
                        {filteredIssues.map((issue) => {
                            const progress = issue.total_count > 0
                                ? Math.round((issue.fixed_count / issue.total_count) * 100)
                                : 0

                            const priorityColor =
                                issue.priority === 'High' ? 'text-red-300 bg-red-900/40 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                                    issue.priority === 'Medium' ? 'text-yellow-300 bg-yellow-900/40 border-yellow-500/30' :
                                        'text-blue-300 bg-blue-900/40 border-blue-500/30';

                            return (
                                <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 group">
                                    <td className="px-6 py-5 text-left">
                                        <Link href={`/fix/${issue.id}`} className="block">
                                            <span className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors block text-base mb-1">{issue.title}</span>
                                            <p className="text-gray-400 text-xs max-w-lg truncate opacity-80 group-hover:opacity-100">{issue.description}</p>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-300 border border-white/10">
                                            {issue.category_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <span className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${priorityColor}`}>
                                            {issue.priority === 'High' ? 'ALTA' : issue.priority === 'Medium' ? 'MEDIA' : 'BAJA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <div className="flex flex-col gap-2 w-36">
                                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                                <span>{issue.fixed_count} / {issue.total_count}</span>
                                                <span className={progress === 100 ? 'text-green-400' : 'text-blue-400'}>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2 border border-white/5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-blue-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-left">
                                        <Link
                                            href={`/fix/${issue.id}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:-translate-y-0.5"
                                        >
                                            Reparar
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {
                    filteredIssues.length === 0 && (
                        <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                            <div className="bg-white/5 p-4 rounded-full mb-4">
                                <CheckCircle className="w-12 h-12 text-gray-600 opacity-50" />
                            </div>
                            <p className="text-lg font-medium text-gray-400">No hay errores en esta categoría.</p>
                            <p className="text-sm text-gray-600 mt-1">¡Buen trabajo manteniendo el sitio limpio!</p>
                        </div>
                    )
                }
            </div >
            {/* Chat Widget */}
            < ChatWidget session={session} />
        </div >
    )
}
