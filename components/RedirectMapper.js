import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    ArrowRight, Check, Save, ExternalLink, Search,
    Filter, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react'

export default function RedirectMapper() {
    const [urls, setUrls] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, verified, missing_dest
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [updating, setUpdating] = useState(null)

    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        fetchUrls()
    }, [page, filter, search])

    const fetchUrls = async () => {
        setLoading(true)
        let query = supabase
            .from('audit_urls')
            .select('*', { count: 'exact' })
            .order('priority', { ascending: false }) // Critical first
            .order('id', { ascending: true })
            .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

        // Filters
        if (filter === 'verified') {
            query = query.eq('redirect_verified', true)
        } else if (filter === 'pending') {
            query = query.eq('redirect_verified', false)
        } else if (filter === 'missing_dest') {
            query = query.is('redirect_destination', null)
        } else if (filter === 'has_dest') {
            query = query.not('redirect_destination', 'is', null)
        }

        // Search
        if (search) {
            query = query.ilike('url', `%${search}%`)
        }

        const { data, count, error } = await query

        if (error) {
            console.error('Error fetching URLs:', error)
        } else {
            setUrls(data || [])
            setTotal(count || 0)
        }
        setLoading(false)
    }

    const updateRedirect = async (id, destination, verified) => {
        setUpdating(id)
        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({
                    redirect_destination: destination,
                    redirect_verified: verified
                })
                .eq('id', id)

            if (error) throw error

            // Update local state
            setUrls(prev => prev.map(u => u.id === id ? { ...u, redirect_destination: destination, redirect_verified: verified } : u))
        } catch (error) {
            console.error('Error updating redirect:', error)
            alert('Error al guardar la redirección')
        } finally {
            setUpdating(null)
        }
    }

    const handleKeyDown = (e, id, destination, verified) => {
        if (e.key === 'Enter') {
            updateRedirect(id, destination, verified)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold">Gestor de Redirecciones</h2>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar URL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-64"
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 outline-none"
                    >
                        <option value="all">Todos</option>
                        <option value="missing_dest">⚠️ Sin Destino</option>
                        <option value="has_dest">↪️ Con Destino</option>
                        <option value="verified">✅ Verificados</option>
                        <option value="pending">⏳ Pendientes</option>
                    </select>

                    <button
                        onClick={() => fetchUrls()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/10 text-xs uppercase text-gray-400">
                                <th className="p-4 w-1/3">URL Origen</th>
                                <th className="p-4 w-1/3">URL Destino (Redirect 301)</th>
                                <th className="p-4 w-32 text-center">Estado</th>
                                <th className="p-4 w-20 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-white/5 rounded w-3/4"></div></td>
                                        <td className="p-4"><div className="h-8 bg-white/5 rounded w-full"></div></td>
                                        <td className="p-4"><div className="h-6 bg-white/5 rounded w-16 mx-auto"></div></td>
                                        <td className="p-4"><div className="h-8 bg-white/5 rounded w-8 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : urls.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">
                                        No se encontraron URLs con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                urls.map(url => (
                                    <tr key={url.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-2">
                                                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${url.priority === 'critical' ? 'bg-red-500' :
                                                        url.priority === 'high' ? 'bg-orange-500' :
                                                            'bg-blue-500'
                                                    }`} title={`Prioridad: ${url.priority}`} />
                                                <div className="min-w-0 break-all">
                                                    <p className="text-sm text-gray-300 font-mono mb-1">{url.url}</p>
                                                    {url.status_code && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${url.status_code >= 400 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                                url.status_code >= 300 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                                    'bg-green-500/10 border-green-500/20 text-green-400'
                                                            }`}>
                                                            {url.status_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    defaultValue={url.redirect_destination || ''}
                                                    placeholder="https://nueva-web.com/..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none placeholder-gray-600 font-mono"
                                                    onKeyDown={(e) => handleKeyDown(e, url.id, e.target.value, url.redirect_verified)}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (url.redirect_destination || '')) {
                                                            updateRedirect(url.id, e.target.value, url.redirect_verified)
                                                        }
                                                    }}
                                                />
                                                {url.redirect_destination && (
                                                    <a
                                                        href={url.redirect_destination}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300"
                                                        title="Abrir destino"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            <button
                                                onClick={() => updateRedirect(url.id, url.redirect_destination, !url.redirect_verified)}
                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${url.redirect_verified
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700 cursor-pointer'
                                                    }`}
                                            >
                                                {url.redirect_verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {url.redirect_verified ? 'Verificado' : 'Pendiente'}
                                            </button>
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            {updating === url.id && (
                                                <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-gray-400">
                        Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} de {total}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page * ITEMS_PER_PAGE >= total}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    )
}
