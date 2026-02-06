import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Check, X, RefreshCw, ExternalLink, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'

export default function URLFixer({
    urls,
    user,
    onUpdate,
    issueTypeId,
    currentPage,
    onPageChange,
    filter,
    onFilterChange,
    totalCount,
    sortField,
    sortOrder,
    onSortChange
}) {
    const [localUrls, setLocalUrls] = useState(urls)
    const [updating, setUpdating] = useState(null)

    // Dual Scroll Refs
    const topScrollRef = useRef(null)
    const tableScrollRef = useRef(null)

    useEffect(() => {
        setLocalUrls(urls)
    }, [urls])

    // Sync Scrolls
    const handleTopScroll = () => {
        if (tableScrollRef.current && topScrollRef.current) {
            tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
        }
    }

    const handleTableScroll = () => {
        if (tableScrollRef.current && topScrollRef.current) {
            topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
        }
    }

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

    const getRowStyle = (ts, as) => {
        const t = Number(ts) || 0;
        const a = Number(as) || 0;

        // 1. CRITICAL TOXIC (Mutant) - TS >= 60
        if (t >= 60) return 'bg-red-950/40 border-red-500/30 hover:bg-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]';

        // 2. DANGEROUS - TS 50-59
        if (t >= 50) return 'bg-red-900/20 border-red-500/20 hover:bg-red-800/30';

        // 3. BAD (Risky) - TS 40-49
        if (t >= 40) return 'bg-orange-900/20 border-orange-500/20 hover:bg-orange-800/30';

        // 4. SUSPICIOUS - TS 30-39
        if (t >= 30) return 'bg-yellow-900/10 border-yellow-500/20 hover:bg-yellow-800/20';

        // 5. LOW VALUE (Junk) - TS < 30 AND AS < 10
        if (a < 10) return 'bg-black/40 border-gray-700/30 hover:bg-gray-900/50 grayscale-[0.3]';

        // 6. STANDARD - TS < 30 AND AS 10-29
        if (a < 30) return 'bg-slate-900/30 border-slate-600/20 hover:bg-slate-800/40';

        // 7. GOOD AUTHORITY - TS < 30 AND AS 30-59
        if (a < 60) return 'bg-blue-950/20 border-blue-500/20 hover:bg-blue-900/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]';

        // 8. PREMIUM AUTHORITY (Elite) - TS < 30 AND AS >= 60
        return 'bg-indigo-950/30 border-indigo-400/30 hover:bg-indigo-900/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]';
    };

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
                <div className="flex gap-4 flex-wrap bg-black/30 p-2 rounded-xl border border-white/5">
                    {['all', 'pending', 'fixed', 'ignored'].map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`mx-1 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${filter === f
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : f === 'fixed' ? 'Corregidos' : f === 'pending' ? 'Pendientes' : 'Ignorados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sorting Toolbar */}
            <div className="bg-white/5 border-b border-white/5 px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Ordenar por:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onSortChange && onSortChange('url')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'url' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">🌍</span> Nombre / URL
                        {sortField === 'url' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                    <button
                        onClick={() => onSortChange && onSortChange('toxicity_score')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'toxicity_score' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">🧪</span> Toxicidad
                        {sortField === 'toxicity_score' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                    <button
                        onClick={() => onSortChange && onSortChange('authority_score')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'authority_score' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">👑</span> Autoridad
                        {sortField === 'authority_score' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                </div>
            </div>

            {/* Top Scroll - Syncs with List */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto border-b border-white/5 bg-black/20"
                style={{ height: '12px' }}
            >
                <div style={{ width: '1200px', height: '1px' }}></div>
            </div>

            {/* Lista - Horizontal Scroll Enabled with Min Width to force scroll */}
            <div
                ref={tableScrollRef}
                onScroll={handleTableScroll}
                className="overflow-x-auto divide-y divide-white/5"
            >
                <div style={{ minWidth: '1200px' }}> {/* Force width to enable scroll */}
                    {localUrls.map((item) => {
                        const { mainUrl, secondaryUrl, secondaryLabel } = getDisplayValues(item);

                        // Determine Row Style
                        let rowClass = '';

                        if (item.status === 'fixed') {
                            rowClass = 'bg-green-900/20 hover:bg-green-900/30 border-l-4 border-l-green-500';
                        } else if (item.status === 'ignored') {
                            rowClass = 'bg-gray-900/20 opacity-50 hover:opacity-80 border-l-4 border-l-gray-600';
                        } else {
                            // Apply Color Rule if not fixed/ignored
                            // Add border-l-4 to indicate status color even more clearly
                            const baseStyle = getRowStyle(item.toxicity_score, item.authority_score);
                            rowClass = `${baseStyle} border-l-4`;

                            // Dynamic Border Left Color matching the bg theme (approx)
                            if (item.toxicity_score >= 60) rowClass += ' border-l-red-600';
                            else if (item.toxicity_score >= 50) rowClass += ' border-l-red-500';
                            else if (item.toxicity_score >= 40) rowClass += ' border-l-orange-500';
                            else if (item.toxicity_score >= 30) rowClass += ' border-l-yellow-500';
                            else if ((Number(item.authority_score) || 0) < 10) rowClass += ' border-l-gray-700';
                            else if ((Number(item.authority_score) || 0) < 30) rowClass += ' border-l-slate-500';
                            else if ((Number(item.authority_score) || 0) < 60) rowClass += ' border-l-blue-500';
                            else rowClass += ' border-l-indigo-400';
                        }

                        return (
                            <div
                                key={item.id}
                                className={`p-5 transition-all duration-200 group border-b border-white/5 ${rowClass} ${updating === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-3 mb-1">
                                            <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-400 hover:text-blue-300 hover:underline truncate block max-w-full md:max-w-2xl transition-colors flex items-center gap-1.5">
                                                {mainUrl} <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                            </a>
                                        </div>

                                        {secondaryUrl && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                                <span className="text-[10px] uppercase tracking-wide font-bold text-gray-600 border border-white/5 bg-white/5 px-1.5 py-0.5 rounded">{secondaryLabel}</span>
                                                <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white truncate max-w-xs md:max-w-md transition-colors text-xs">{secondaryUrl}</a>

                                                {/* Toxicity Badge - Mini */}
                                                {(item.toxicity_score !== null && item.toxicity_score !== undefined) && (
                                                    (() => {
                                                        const score = Number(item.toxicity_score);
                                                        const isHigh = score >= 60;
                                                        const isMedium = score >= 30 && score < 60;

                                                        const badgeStyle = isHigh
                                                            ? 'bg-red-950/40 border-red-500/30 text-red-300'
                                                            : isMedium
                                                                ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-300'
                                                                : 'bg-green-950/40 border-green-500/30 text-green-300';

                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ml-2 ${badgeStyle}`}>
                                                                <span>🧪 TS: {score}</span>
                                                            </span>
                                                        );
                                                    })()
                                                )}

                                                {/* Authority Score Badge - Mini */}
                                                {(item.authority_score !== null && item.authority_score !== undefined) && (
                                                    (() => {
                                                        const score = Number(item.authority_score);
                                                        const isHigh = score >= 40;
                                                        const isMedium = score >= 20 && score < 40;

                                                        const badgeStyle = isHigh
                                                            ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                                                            : isMedium
                                                                ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                                                : 'bg-gray-800/40 border-gray-600/30 text-gray-400';

                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}>
                                                                <span>👑 AS: {score}</span>
                                                            </span>
                                                        );
                                                    })()
                                                )}
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
                                            <span className="text-xs font-bold uppercase tracking-wider">{item.status === 'fixed' ? 'CORREGIDO' : '🔧 REPARAR'}</span>
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
        </div >
    )
}
