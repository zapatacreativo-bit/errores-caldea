import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    CheckCircle, Circle, AlertCircle, Loader2,
    Settings, FileText, Link2, Globe, RefreshCw
} from 'lucide-react'

export default function TechnicalChecklist() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        fetchChecklist()
    }, [])

    const fetchChecklist = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('migration_checklist')
            .select('*')
            .order('category', { ascending: true })
            .order('id', { ascending: true })
        setItems(data || [])
        setLoading(false)
    }

    const updateStatus = async (id, newStatus) => {
        setUpdating(id)
        const { data: { user } } = await supabase.auth.getUser()

        await supabase
            .from('migration_checklist')
            .update({
                status: newStatus,
                verified_by: newStatus === 'verified' ? user?.id : null,
                verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        fetchChecklist()
        setUpdating(null)
    }

    const getCategoryIcon = (category) => {
        const icons = {
            technical: <Settings className="w-4 h-4" />,
            content: <FileText className="w-4 h-4" />,
            redirects: <Link2 className="w-4 h-4" />
        }
        return icons[category] || <Globe className="w-4 h-4" />
    }

    const getCategoryColor = (category) => {
        const colors = {
            technical: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
            content: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
            redirects: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
        }
        return colors[category] || 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }

    const getStatusIcon = (status) => {
        const icons = {
            verified: <CheckCircle className="w-5 h-5 text-green-500" />,
            in_progress: <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />,
            error: <AlertCircle className="w-5 h-5 text-red-500" />,
            pending: <Circle className="w-5 h-5 text-gray-500" />
        }
        return icons[status] || icons.pending
    }

    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {})

    const categoryLabels = {
        technical: 'Técnico',
        content: 'Contenido',
        redirects: 'Redirecciones'
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
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-400" />
                    Checklist Técnico de Migración
                </h2>
                <button
                    onClick={fetchChecklist}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className={`px-4 py-3 border-b border-white/10 flex items-center gap-2 ${getCategoryColor(category)}`}>
                        {getCategoryIcon(category)}
                        <span className="font-bold uppercase text-sm">{categoryLabels[category] || category}</span>
                        <span className="ml-auto text-xs opacity-70">
                            {categoryItems.filter(i => i.status === 'verified').length}/{categoryItems.length} completados
                        </span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {categoryItems.map(item => (
                            <div key={item.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <button
                                    onClick={() => {
                                        const nextStatus = {
                                            pending: 'in_progress',
                                            in_progress: 'verified',
                                            verified: 'pending',
                                            error: 'pending'
                                        }
                                        updateStatus(item.id, nextStatus[item.status])
                                    }}
                                    disabled={updating === item.id}
                                    className="flex-shrink-0"
                                >
                                    {updating === item.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    ) : (
                                        getStatusIcon(item.status)
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium ${item.status === 'verified' ? 'line-through text-gray-500' : 'text-white'}`}>
                                        {item.item_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                </div>
                                <select
                                    value={item.status}
                                    onChange={(e) => updateStatus(item.id, e.target.value)}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="pending" className="bg-black text-white">⏳ Pendiente</option>
                                    <option value="in_progress" className="bg-black text-white">🔄 En Progreso</option>
                                    <option value="verified" className="bg-black text-white">✅ Verificado</option>
                                    <option value="error" className="bg-black text-white">❌ Error</option>
                                </select>

                            </div>
                        ))}
                    </div>
                </div>
            ))
            }
        </div >
    )
}
