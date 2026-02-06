import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import GlassCard from './ui/GlassCard'
import { getRandomHistoricalQuotes } from '../lib/quotes'
import { Link2, Globe, Shield, Activity, Search, ExternalLink, Copy, X } from 'lucide-react'

export default function BacklinkAnalysis() {
    const [domains, setDomains] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalDomains: 0,
        highAuthority: 0,
        totalBacklinks: 0,
        avgAuthority: 0
    })
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'authority_score', direction: 'desc' })
    const itemsPerPage = 50

    // Modal State (Copy Domain)
    const [selectedDomain, setSelectedDomain] = useState(null)
    const [copySuccess, setCopySuccess] = useState('')

    // Details Modal State (Backlinks List)
    const [showDetails, setShowDetails] = useState(false)
    const [detailsDomain, setDetailsDomain] = useState(null)
    const [backlinkUrls, setBacklinkUrls] = useState([])
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [cardQuotes, setCardQuotes] = useState([])

    useEffect(() => {
        setCardQuotes(getRandomHistoricalQuotes(4))
    }, [])

    useEffect(() => {
        fetchData()
    }, [page, search, sortConfig])

    const handleCopyOpen = (domain) => {
        setSelectedDomain(domain)
        setCopySuccess('')
    }

    const copyToClipboard = () => {
        if (selectedDomain) {
            navigator.clipboard.writeText(selectedDomain)
            setCopySuccess('¡Copiado!')
            setTimeout(() => setCopySuccess(''), 2000)
        }
    }

    // New Function: Fetch detailed URLs for a domain
    const handleShowDetails = async (domain) => {
        setDetailsDomain(domain)
        setShowDetails(true)
        setLoadingDetails(true)
        setBacklinkUrls([])

        // Normalize domain (strip www.) to ensure broad matching
        const cleanDomain = domain.replace(/^www\./i, '')

        try {
            const { data, error } = await supabase
                .from('backlink_urls')
                .select('source_url')
                // Match exact clean domain OR any subdomain ending in .cleanDomain
                .or(`source_domain.eq.${cleanDomain},source_domain.ilike.%.${cleanDomain}`)
                .limit(2000)

            if (error) throw error
            setBacklinkUrls(data || [])
        } catch (err) {
            console.error('Error fetching details:', err)
        } finally {
            setLoadingDetails(false)
        }
    }

    const copyAllUrls = () => {
        const text = backlinkUrls.map(u => u.source_url).join('\n')
        navigator.clipboard.writeText(text)
        setCopySuccess('¡Lista Copiada!')
        setTimeout(() => setCopySuccess(''), 2000)
    }

    async function fetchData() {
        setLoading(true)
        try {
            // Stats (Global) - Could be cached or optimized
            const { data: statsData, error: statsError } = await supabase
                .from('ref_domains')
                .select('authority_score, backlinks')

            if (!statsError && statsData) {
                const totalDomains = statsData.length
                const highAuthority = statsData.filter(d => d.authority_score > 50).length
                const totalBacklinks = statsData.reduce((acc, curr) => acc + (curr.backlinks || 0), 0)
                const avgAuthority = totalDomains > 0
                    ? (statsData.reduce((acc, curr) => acc + (curr.authority_score || 0), 0) / totalDomains).toFixed(1)
                    : 0

                setStats({ totalDomains, highAuthority, totalBacklinks, avgAuthority })
            }

            // List Query
            let query = supabase
                .from('ref_domains')
                .select('*')

            if (search) {
                query = query.ilike('domain', `%${search}%`)
            }

            query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
            query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

            const { data: listData, error: listError } = await query

            if (listError) throw listError
            setDomains(listData || [])

        } catch (error) {
            console.error('Error fetching backlinks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
        })
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">

            {/* Backlink Details Modal (NEW) */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
                        <button
                            onClick={() => setShowDetails(false)}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-indigo-400" /> Enlaces desde {detailsDomain}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Mostrando {backlinkUrls.length} enlaces encontrados.
                        </p>

                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : backlinkUrls.length > 0 ? (
                                <>
                                    <div className="relative flex-1">
                                        <textarea
                                            readOnly
                                            value={backlinkUrls.map(u => u.source_url).join('\n')}
                                            className="w-full h-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                                            onClick={(e) => e.target.select()}
                                        />
                                    </div>
                                    <button
                                        onClick={copyAllUrls}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copySuccess || 'Copiar Lista Completa al Portapapeles'}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                    No se encontraron URLs específicas para este dominio en la base de datos de detalles.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Copying Domain */}
            {selectedDomain && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setSelectedDomain(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Copy className="w-5 h-5 text-indigo-400" /> Copiar Dominio
                        </h3>

                        <div className="space-y-4">
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={selectedDomain}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                                    onClick={(e) => e.target.select()}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                                >
                                    {copySuccess || 'Copiar al Portapapeles'}
                                </button>
                                <a
                                    href={`https://${selectedDomain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" /> Visitar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HUD Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/warrior.png" alt="Warrior Sage" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[0]?.text}"
                                </p>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                    — {cardQuotes[0]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-400" /> Dominios Referentes
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {stats.totalDomains}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/celebration.png" alt="Celebration Sage" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[1]?.text}"
                                </p>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                    — {cardQuotes[1]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-400" /> Alta Autoridad (+50)
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {stats.highAuthority}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/champion.png" alt="Champion Sage" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[2]?.text}"
                                </p>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    — {cardQuotes[2]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-blue-400" /> Total Backlinks
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {new Intl.NumberFormat('es-ES').format(stats.totalBacklinks)}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/hold.png" alt="Hold Sage" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[3]?.text}"
                                </p>
                                <p className="text-xs font-bold text-green-400 uppercase tracking-widest">
                                    — {cardQuotes[3]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-400" /> Autoridad Media
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {stats.avgAuthority}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Table */}
            <GlassCard className="p-6" hoverEffect={false}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">Dominios de Referencia</h2>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                            {domains.length} visibles
                        </span>
                    </div>

                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar dominio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs uppercase text-gray-400">
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('domain')}>Dominio</th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('authority_score')}>AS (Autoridad)</th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('backlinks')}>Backlinks</th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('country')}>País</th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ip_address')}>IP</th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('last_seen')}>Visto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 animate-pulse">
                                        Cargando backlinks...
                                    </td>
                                </tr>
                            ) : domains.map((row, idx) => (
                                <tr key={idx} className="transition-colors group">
                                    <td className="p-4 font-medium text-white transition-colors">
                                        <div className="flex items-center gap-2 group-hover:text-indigo-400">
                                            <button
                                                onClick={() => handleCopyOpen(row.domain)}
                                                className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                                                title="Ver y Copiar"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <a
                                                href={`https://${row.domain}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate max-w-[250px] hover:underline"
                                            >
                                                {row.domain}
                                            </a>
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded border font-bold text-xs ${row.authority_score >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                            row.authority_score >= 20 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                'bg-white/5 border-white/10 text-gray-300'
                                            }`}>
                                            {row.authority_score || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-mono text-gray-300">
                                        <button
                                            onClick={() => handleShowDetails(row.domain)}
                                            className="hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-colors underline decoration-dotted underline-offset-4 decoration-gray-600 hover:decoration-white"
                                            title="Ver lista de enlaces"
                                        >
                                            {new Intl.NumberFormat('es-ES').format(row.backlinks)}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        {row.country ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <img
                                                    src={`https://flagcdn.com/w20/${row.country.toLowerCase()}.png`}
                                                    srcSet={`https://flagcdn.com/w40/${row.country.toLowerCase()}.png 2x`}
                                                    width="20"
                                                    height="15"
                                                    alt={row.country}
                                                    className="rounded-sm shadow-sm"
                                                    onError={(e) => { e.target.style.display = 'none' }}
                                                />
                                                <span className="text-xs font-mono text-gray-400">{row.country.toUpperCase()}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center text-xs text-gray-500 font-mono">
                                        {row.ip_address}
                                    </td>
                                    <td className="p-4 text-right text-xs text-gray-400">
                                        {row.last_seen ? new Date(row.last_seen).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm disabled:opacity-50 transition-all"
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-gray-500 font-mono">Página {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-all shadow-lg shadow-blue-900/20"
                    >
                        Siguiente
                    </button>
                </div>
            </GlassCard>
        </div>
    )
}
