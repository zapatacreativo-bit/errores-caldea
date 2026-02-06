import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    BarChart3, Target, CheckCircle2, AlertTriangle, Clock,
    ArrowRight, TrendingUp, Zap, Shield, FileText
} from 'lucide-react'

export default function MigrationProgress() {
    const [summary, setSummary] = useState(null)
    const [progress, setProgress] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch summary
        const { data: summaryData } = await supabase
            .from('v_migration_summary')
            .select('*')
            .single()

        // Fetch progress by category
        const { data: progressData } = await supabase
            .from('v_migration_progress')
            .select('*')

        setSummary(summaryData)
        setProgress(progressData || [])
        setLoading(false)
    }

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-500'
        if (percentage >= 50) return 'bg-yellow-500'
        if (percentage >= 25) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const getPriorityIcon = (priority) => {
        const icons = {
            critical: <Zap className="w-4 h-4 text-red-500" />,
            high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
            medium: <Target className="w-4 h-4 text-yellow-500" />,
            low: <Clock className="w-4 h-4 text-gray-500" />
        }
        return icons[priority] || icons.medium
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
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total URLs */}
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl border border-blue-500/20 p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <FileText className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Total URLs</span>
                    </div>
                    <p className="text-3xl font-black text-white">{summary?.total_urls || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {summary?.urls_fixed || 0} corregidas ({summary?.total_urls ? Math.round((summary.urls_fixed / summary.total_urls) * 100) : 0}%)
                    </p>
                </div>

                {/* Critical URLs */}
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl border border-red-500/20 p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <Zap className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Críticas</span>
                    </div>
                    <p className="text-3xl font-black text-white">{summary?.critical_urls || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {summary?.critical_fixed || 0} completadas
                    </p>
                </div>

                {/* Redirects */}
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl border border-purple-500/20 p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <ArrowRight className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Redirecciones</span>
                    </div>
                    <p className="text-3xl font-black text-white">{summary?.urls_with_redirect || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {summary?.redirects_verified || 0} verificadas
                    </p>
                </div>

                {/* Checklist */}
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl border border-green-500/20 p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Checklist</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {summary?.checklist_verified || 0}/{summary?.total_checklist || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        items verificados
                    </p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Progreso de Migración
                </h3>

                <div className="space-y-4">
                    {/* URLs by Priority */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase">URLs por Prioridad</p>
                        {progress.filter(p => p.section === 'urls').map(item => (
                            <div key={item.category} className="flex items-center gap-3">
                                <div className="w-20 flex items-center gap-1">
                                    {getPriorityIcon(item.category)}
                                    <span className="text-xs capitalize">{item.category}</span>
                                </div>
                                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(item.percentage)} transition-all duration-500`}
                                        style={{ width: `${item.percentage || 0}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-20 text-right">
                                    {item.completed}/{item.total} ({item.percentage || 0}%)
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Checklist Categories */}
                    <div className="space-y-3 mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs font-bold text-gray-500 uppercase">Checklist Técnico</p>
                        {progress.filter(p => p.section === 'checklist').map(item => (
                            <div key={item.category} className="flex items-center gap-3">
                                <div className="w-20">
                                    <span className="text-xs capitalize">{item.category}</span>
                                </div>
                                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(item.percentage)} transition-all duration-500`}
                                        style={{ width: `${item.percentage || 0}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-20 text-right">
                                    {item.completed}/{item.total} ({item.percentage || 0}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Progreso Global
                    </h3>
                    <span className="text-3xl font-black text-white">
                        {summary?.total_urls ? Math.round((summary.urls_fixed / summary.total_urls) * 100) : 0}%
                    </span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000"
                        style={{ width: `${summary?.total_urls ? Math.round((summary.urls_fixed / summary.total_urls) * 100) : 0}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
