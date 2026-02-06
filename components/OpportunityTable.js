import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    ArrowRight, ExternalLink, Search, Filter,
    CheckCircle2, AlertCircle, RefreshCw, X,
    ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react'


export default function OpportunityTable({
    title,
    description,
    icon: Icon,
    fetchDataFn,
    columns = []
}) {
    const [urls, setUrls] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        loadData()
    }, [page, search, sortConfig])

    const loadData = async () => {
        setLoading(true)
        try {
            const { data, count } = await fetchDataFn({
                page,
                itemsPerPage: ITEMS_PER_PAGE,
                search,
                sortConfig
            })
            setUrls(data || [])
            setTotal(count || 0)
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleSort = (key) => {
        if (!key) return
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
        setPage(1) // Reset to first page
    }

    const toggleStatus = async (id, currentStatus) => {
        setUpdating(id)
        const newStatus = currentStatus === 'fixed' ? 'pending' : 'fixed'

        // Optimistic update
        setUrls(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))

        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            // Revert
            setUrls(prev => prev.map(u => u.id === id ? { ...u, status: currentStatus } : u))
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        {title}
                    </h1>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar URL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/10 text-xs uppercase text-gray-400">
                                <th
                                    className="p-5 w-1/2 cursor-pointer hover:text-white transition-colors group select-none"
                                    onClick={() => handleSort('url')}
                                >
                                    <div className="flex items-center gap-2">
                                        URL / Página
                                        {sortConfig.key === 'url' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                                        )}
                                    </div>
                                </th>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`p-5 text-center select-none ${col.sortKey ? 'cursor-pointer hover:text-white transition-colors group' : ''}`}
                                        onClick={() => col.sortKey && handleSort(col.sortKey)}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {col.header}
                                            {col.sortKey && (
                                                sortConfig.key === col.sortKey ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-5 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-5"><div className="h-4 bg-white/5 rounded w-3/4"></div></td>
                                        {columns.map((_, idx) => (
                                            <td key={idx} className="p-5"><div className="h-4 bg-white/5 rounded w-16 mx-auto"></div></td>
                                        ))}
                                        <td className="p-5"><div className="h-6 bg-white/5 rounded w-20 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : urls.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="p-10 text-center text-gray-500">
                                        👏 ¡Limpio! No se encontraron URLs que cumplan este criterio.
                                    </td>
                                </tr>
                            ) : (
                                urls.map(url => (
                                    <tr key={url.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 align-top">
                                            <div className="flex items-start gap-3">
                                                <a
                                                    href={url.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-sm text-blue-400 hover:text-blue-300 hover:underline break-all block"
                                                >
                                                    {url.url} <ExternalLink className="w-3 h-3 inline opacity-50 ml-1" />
                                                </a>
                                            </div>
                                            {url.page_title && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{url.page_title}</p>
                                            )}
                                        </td>

                                        {columns.map((col, idx) => (
                                            <td key={idx} className="p-5 text-center align-top">
                                                {col.render(url)}
                                            </td>
                                        ))}

                                        <td className="p-5 align-top text-center">
                                            <button
                                                onClick={() => toggleStatus(url.id, url.status)}
                                                disabled={updating === url.id}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${url.status === 'fixed'
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {updating === url.id ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : url.status === 'fixed' ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                ) : (
                                                    <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
                                                )}
                                                {url.status === 'fixed' ? 'CORREGIDO' : 'MARCAR'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-gray-400">
                        <span className="text-white font-bold">{total}</span> oportunidades encontradas
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-xs font-mono bg-black/40 px-3 py-2 rounded border border-white/5">
                            Page {page}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page * ITEMS_PER_PAGE >= total}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
