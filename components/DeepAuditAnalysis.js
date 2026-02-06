import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import {
    BarChart3, Layers, FileText, Link2, Zap,
    Search, PieChart, ArrowUpRight
} from 'lucide-react'

export default function DeepAuditAnalysis() {
    const router = useRouter()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)

        // Simulating aggregate data fetch since we might not have data populated yet
        // In real scenario, we would use proper RPC or Group By queries
        const { data: qStats } = await supabase.from('v_content_quality').select('*').single()

        setStats(qStats || {
            total_pages: 0,
            thin_content_pages: 0,
            deep_pages: 0,
            avg_word_count: 0,
            avg_internal_links: 0,
            non_indexable_pages: 0
        })
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Content Quality Card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-2 mb-4 text-purple-400">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-bold uppercase text-xs">Calidad de Contenido</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-3xl font-black text-white">{stats.avg_word_count || 0}</p>
                            <p className="text-xs text-gray-500">Palabras promedio por página</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400">Thin Content (&lt;300 pal.)</span>
                                <span className="text-xs font-bold text-red-400">{stats.thin_content_pages} págs</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500/50" style={{ width: `${(stats.thin_content_pages / (stats.total_pages || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Structure & Linking Card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                        <Link2 className="w-5 h-5" />
                        <h3 className="font-bold uppercase text-xs">Arquitectura</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-3xl font-black text-white">{stats.avg_internal_links || 0}</p>
                            <p className="text-xs text-gray-500">Promedio enlaces internos</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400">Profundidad &gt; 3 clicks</span>
                                <span className="text-xs font-bold text-yellow-400">{stats.deep_pages} págs</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500/50" style={{ width: `${(stats.deep_pages / (stats.total_pages || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Indexability Card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-2 mb-4 text-green-400">
                        <Search className="w-5 h-5" />
                        <h3 className="font-bold uppercase text-xs">Indexabilidad</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-black text-white">
                                    {Math.round(((stats.total_pages - stats.non_indexable_pages) / (stats.total_pages || 1)) * 100)}%
                                </p>
                                <p className="text-xs text-gray-500">Indexable</p>
                            </div>
                            <PieChart className="w-8 h-8 text-white/20" />
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                {stats.total_pages - stats.non_indexable_pages} Indexables
                            </span>
                            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                {stats.non_indexable_pages} No Indexables
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recommendations */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Oportunidades Detectadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Potenciar Enlazado Interno */}
                    <div className="p-5 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Link2 className="w-16 h-16 text-blue-400" />
                        </div>
                        <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            Potenciar Link Juice
                        </h4>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                            Tienes páginas "huerfanitas" o con menos cariño del que merecen (&lt; 5 enlaces).
                            Si no las enlazas tú, Google pasará de ellas olímpicamente. ¡Dales fuerza interna!
                        </p>
                        <button
                            onClick={() => router.push('/opportunities/internal-linking')}
                            className="text-xs text-white bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all w-fit group-hover:pl-4"
                        >
                            Ver las olvidadas <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Optimizar Profundidad */}
                    <div className="p-5 bg-black/20 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layers className="w-16 h-16 text-yellow-400" />
                        </div>
                        <h4 className="font-bold text-yellow-400 text-sm mb-2 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Nivel de Profundidad
                        </h4>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                            {stats.deep_pages} páginas están más escondidas que el tesoro del Titanic (&gt; 3 clicks).
                            Google es vago por naturaleza, pónselo fácil o no llegará nunca a rastrearlas.
                        </p>
                        <button
                            onClick={() => router.push('/opportunities/depth')}
                            className="text-xs text-white bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all w-fit group-hover:pl-4"
                        >
                            Ver las profundas <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Enriquecer Contenido */}
                    <div className="p-5 bg-black/20 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText className="w-16 h-16 text-red-400" />
                        </div>
                        <h4 className="font-bold text-red-400 text-sm mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Anti Thin Content
                        </h4>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                            Detectadas {stats.thin_content_pages} páginas con menos chicha que un telegrama.
                            Si no aportas valor, ese contenido es lastre. O lo engordas con calidad o te lo cargas.
                        </p>
                        <button
                            onClick={() => router.push('/opportunities/content')}
                            className="text-xs text-white bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all w-fit group-hover:pl-4"
                        >
                            Ver las flacas <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
