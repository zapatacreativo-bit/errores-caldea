import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import GlassCard from './ui/GlassCard'
import { getRandomHistoricalQuotes } from '../lib/quotes'
import { ArrowUp, ArrowDown, Search, Filter, TrendingUp, TrendingDown, DollarSign, Activity, Eye, Zap } from 'lucide-react'

export default function RankingTraffic() {
    const [keywords, setKeywords] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalTraffic: 0,
        totalValue: 0,
        topKeywords: 0,
        avgPosition: 0
    })
    const [page, setPage] = useState(1)
    // We need internal state for Market
    const [market, setMarket] = useState('es') // 'es' | 'fr' | 'us'
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'traffic', direction: 'desc' })

    const itemsPerPage = 50
    const [cardQuotes, setCardQuotes] = useState([])

    useEffect(() => {
        setCardQuotes(getRandomHistoricalQuotes(4))
    }, [])

    useEffect(() => {
        fetchData()
    }, [page, searchTerm, sortConfig, market]) // Include market dependency

    async function fetchData() {
        setLoading(true)
        try {
            // Stats Query
            const { data: statsData, error: statsError } = await supabase
                .from('ranking_traffic')
                .select('traffic, traffic_cost, position')
                .eq('market', market) // Filter by market

            if (!statsError && statsData) {
                const totalTraffic = statsData.reduce((acc, curr) => acc + (Number(curr.traffic) || 0), 0)
                const totalValue = statsData.reduce((acc, curr) => acc + (Number(curr.traffic_cost) || 0), 0)
                const topKeywords = statsData.filter(k => k.position <= 3).length
                const avgPosition = statsData.length > 0
                    ? (statsData.reduce((acc, curr) => acc + (Number(curr.position) || 0), 0) / statsData.length).toFixed(1)
                    : 0

                setStats({ totalTraffic, totalValue, topKeywords, avgPosition })
            }

            // List Query
            let query = supabase
                .from('ranking_traffic')
                .select('*')
                .eq('market', market) // Filter by market

            if (searchTerm) {
                query = query.ilike('keyword', `%${searchTerm}%`)
            }

            query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
            query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

            const { data: listData, error: listError } = await query

            if (listError) throw listError
            setKeywords(listData || [])

        } catch (error) {
            console.error('Error fetching ranking data:', error)
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

    const formatCurrency = (val) => {
        const currency = market === 'us' ? 'USD' : 'EUR'
        const locale = market === 'us' ? 'en-US' : 'es-ES'
        const secureLocale = market === 'fr' ? 'fr-FR' : locale
        return new Intl.NumberFormat(secureLocale, { style: 'currency', currency }).format(val)
    }
    const formatNumber = (val) => new Intl.NumberFormat('es-ES').format(val)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Market Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-1">
                <button
                    onClick={() => { setMarket('es'); setPage(1); }}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg flex items-center gap-2 ${market === 'es' ? 'bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" className="w-5 h-3.5 rounded-sm shadow-sm">
                        <rect width="750" height="500" fill="#c60b1e" />
                        <rect width="750" height="250" y="125" fill="#ffc400" />
                    </svg>
                    España
                </button>
                <button
                    onClick={() => { setMarket('fr'); setPage(1); }}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg flex items-center gap-2 ${market === 'fr' ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="w-5 h-3.5 rounded-sm shadow-sm">
                        <rect width="900" height="600" fill="#ED2939" />
                        <rect width="600" height="600" fill="#fff" />
                        <rect width="300" height="600" fill="#002395" />
                    </svg>
                    Francia
                </button>
                <button
                    onClick={() => { setMarket('us'); setPage(1); }}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg flex items-center gap-2 ${market === 'us' ? 'bg-red-500/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1235 650" className="w-5 h-3.5 rounded-sm shadow-sm">
                        <rect width="1235" height="650" fill="#b22234" />
                        <path d="M0,50H1235M0,150H1235M0,250H1235M0,350H1235M0,450H1235M0,550H1235" stroke="#fff" strokeWidth="50" />
                        <rect width="494" height="350" fill="#3c3b6e" />
                    </svg>
                    USA
                </button>
            </div>

            {/* HUD Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/coffee.png" alt="Inspiration" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[0]?.text}"
                                </p>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    — {cardQuotes[0]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Tráfico Est. Mensual
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {formatNumber(stats.totalTraffic)}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/money.png" alt="Inspiration" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[1]?.text}"
                                </p>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                    — {cardQuotes[1]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" /> Valor de Tráfico
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {formatCurrency(stats.totalValue)}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/mambo.png" alt="Inspiration" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[2]?.text}"
                                </p>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                    — {cardQuotes[2]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> Top 3 Keywords
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {formatNumber(stats.topKeywords)}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    className="p-6 relative overflow-hidden group"
                    fullBleed={true}
                    backContent={(
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src="/assets/flip-cards/rocket.png" alt="Inspiration" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative z-10 px-6 text-center">
                                <p className="text-lg font-bold text-white italic drop-shadow-lg mb-3 leading-relaxed">
                                    "{cardQuotes[3]?.text}"
                                </p>
                                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                                    — {cardQuotes[3]?.author}
                                </p>
                            </div>
                        </div>
                    )}
                >
                    <div className="relative z-10">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" /> Posición Media
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight font-mono">
                            {stats.avgPosition}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Controls & Table */}
            <GlassCard className="p-6" hoverEffect={false}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">Keywords & Rankings</h2>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold">
                            {keywords.length} visibles
                        </span>
                    </div>

                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs uppercase text-gray-400">
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('keyword')}>
                                    Keyword
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('position')}>
                                    Posición
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('search_volume')}>
                                    Volumen
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('traffic')}>
                                    Tráfico
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('keyword_difficulty')}>
                                    KD %
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('traffic_cost')}>
                                    Valor (€)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 animate-pulse">
                                        Cargando datos de ranking...
                                    </td>
                                </tr>
                            ) : keywords.map((row, idx) => (
                                <tr key={idx} className="transition-colors group">
                                    <td className="p-4">
                                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                            {row.keyword}
                                        </div>
                                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:underline truncate max-w-[200px] block">
                                            {row.url}
                                        </a>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg border font-bold ${row.position <= 3 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                            row.position <= 10 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                'bg-gray-800/30 border-white/5 text-gray-400'
                                            }`}>
                                            {row.position}
                                        </div>
                                        {row.previous_position && row.previous_position !== row.position && (
                                            <div className={`text-[10px] mt-1 flex items-center justify-center gap-0.5 ${row.position < row.previous_position ? 'text-green-400' : 'text-red-400'}`}>
                                                {row.position < row.previous_position ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
                                                {Math.abs(row.previous_position - row.position)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-mono text-gray-300">
                                        {formatNumber(row.search_volume)}
                                    </td>
                                    <td className="p-4 text-center font-mono text-white font-bold">
                                        {formatNumber(row.traffic)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${row.keyword_difficulty > 80 ? 'bg-red-500' :
                                                    row.keyword_difficulty > 50 ? 'bg-orange-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${row.keyword_difficulty}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">{row.keyword_difficulty}%</div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-emerald-400">
                                        {formatCurrency(row.traffic_cost)}
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
