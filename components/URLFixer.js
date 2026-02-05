import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Check, X, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react'

export default function URLFixer({
    urls,
    user,
    onUpdate,
    issueTypeId,
    currentPage,
    onPageChange,
    filter,
    onFilterChange,
    totalCount
}) {
    const [localUrls, setLocalUrls] = useState(urls)
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        setLocalUrls(urls)
    }, [urls])

    const getDisplayValues = (item) => {
        if (parseInt(issueTypeId) === 15) {
            return {
                mainUrl: item.linked_from,
                secondaryUrl: item.url,
                secondaryLabel: 'Encontrado en (Origen):'
            };
        }
        return {
            mainUrl: item.url,
            secondaryUrl: item.linked_from,
            secondaryLabel: 'Encontrado en:'
        };
    };

    const toggleFix = async (id, currentStatus) => {
        setUpdating(id)
        const newStatus = currentStatus === 'fixed' ? 'pending' : 'fixed'
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))

        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({
                    status: newStatus,
                    fixed_by: newStatus === 'fixed' ? user.id : null,
                    fixed_at: newStatus === 'fixed' ? new Date().toISOString() : null
                })
                .eq('id', id)

            if (error) throw error
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error actualizando:', error)
            setLocalUrls(urls)
            alert('Error al guardar.')
        } finally {
            setUpdating(null)
        }
    }

    const ignoreUrl = async (id) => {
        setUpdating(id)
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'ignored' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'ignored' }).eq('id', id)
            if (error) throw error
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            setLocalUrls(urls)
        } finally {
            setUpdating(null)
        }
    }

    const reactivateUrl = async (id) => {
        setUpdating(id)
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'pending' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'pending' }).eq('id', id)
            if (error) throw error
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            setLocalUrls(urls)
        } finally {
            setUpdating(null)
        }
    }

    const ITEMS_PER_PAGE = 50
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Lista de URLs <span className="text-sm font-normal text-gray-400 bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{totalCount} total</span>
                    </h3>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 flex-wrap bg-black/30 p-1 rounded-lg border border-white/5">
                    {['all', 'pending', 'fixed', 'ignored'].map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : f === 'fixed' ? 'Corregidos' : f === 'pending' ? 'Pendientes' : 'Ignorados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-white/5">
                {localUrls.map((item) => {
                    const { mainUrl, secondaryUrl, secondaryLabel } = getDisplayValues(item);
                    return (
                        <div
                            key={item.id}
                            className={`p-5 transition-all duration-200 group ${item.status === 'fixed' ? 'bg-green-500/5 hover:bg-green-500/10' :
                                item.status === 'ignored' ? 'bg-gray-500/5 opacity-60 hover:opacity-100' :
                                    'hover:bg-white/5'
                                } ${updating === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-3 mb-2">
                                        <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-400 hover:text-blue-300 hover:underline truncate block max-w-full md:max-w-2xl transition-colors flex items-center gap-1.5">
                                            {mainUrl} <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                        </a>

                                        {/* Toxicity Badge */}
                                        {item.toxicity_score !== null && item.toxicity_score !== undefined && (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${item.toxicity_score >= 60 ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                    item.toxicity_score >= 30 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                        'bg-green-500/20 text-green-300 border-green-500/30'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${item.toxicity_score >= 60 ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]' :
                                                        item.toxicity_score >= 30 ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.6)]' :
                                                            'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]'
                                                    }`}></span>
                                                TOXICIDAD: {item.toxicity_score}
                                            </span>
                                        )}
                                    </div>

                                    {secondaryUrl && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="text-xs uppercase tracking-wide font-semibold text-gray-600">{secondaryLabel}</span>
                                            <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white truncate max-w-lg transition-colors">{secondaryUrl}</a>
                                        </div>
                                    )}

                                    {item.notes && (
                                        <p className="inline-flex items-center gap-2 text-xs text-yellow-200/80 bg-yellow-500/10 px-3 py-1.5 rounded mt-2 border border-yellow-500/20">
                                            <AlertTriangle className="w-3 h-3" />
                                            Note: {item.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className={`inline-flex items-center cursor-pointer select-none px-4 py-2 rounded-lg border transition-all ${item.status === 'fixed'
                                        ? 'bg-green-500/20 border-green-500/30 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                        }`}>
                                        <input type="checkbox" className="hidden" checked={item.status === 'fixed'} onChange={() => toggleFix(item.id, item.status)} disabled={updating === item.id || item.status === 'ignored'} />
                                        {item.status === 'fixed' ? <Check className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 mr-2 border-2 border-current rounded-sm" />}
                                        <span className="text-xs font-bold uppercase tracking-wider">{item.status === 'fixed' ? 'CORREGIDO' : 'MARCAR'}</span>
                                    </label>

                                    {item.status !== 'ignored' && (
                                        <button onClick={() => ignoreUrl(item.id)} disabled={updating === item.id} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Ignorar">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}

                                    {item.status === 'ignored' && (
                                        <button onClick={() => reactivateUrl(item.id)} disabled={updating === item.id} className="p-2 rounded-lg text-blue-500 hover:text-blue-300 hover:bg-blue-500/10 transition-colors" title="Reactivar">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        « Inicio
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Anterior
                    </button>
                </div>

                <span className="text-sm text-gray-400 font-medium">
                    Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages || 1}</span>
                </span>

                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage >= totalPages ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Siguiente
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage >= totalPages ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Fin »
                    </button>
                </div>
            </div>
        </div>
    )
}
