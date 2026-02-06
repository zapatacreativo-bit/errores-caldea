import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import URLFixer from '../../components/URLFixer'
import Head from 'next/head'
import Link from 'next/link'
import GlassCard from '../../components/ui/GlassCard'
import { ArrowLeft, CheckCircle, AlertTriangle, AlertOctagon, Activity, Power } from 'lucide-react'

export default function FixPage() {
    const router = useRouter()
    const { id } = router.query

    const [session, setSession] = useState(null)
    const [issueType, setIssueType] = useState(null)
    const [urls, setUrls] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (!session) {
                router.push('/')
            }
        })
    }, [router])

    const [page, setPage] = useState(1)
    const [totalUrls, setTotalUrls] = useState(0)
    const [filter, setFilter] = useState('all') // all, pending, fixed, ignored
    const [sortField, setSortField] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const ITEMS_PER_PAGE = 50

    useEffect(() => {
        if (id && session) {
            fetchIssueDetails()
            fetchUrls(1, 'all', 'created_at', 'desc')
        }
    }, [id, session])

    async function fetchIssueDetails() {
        try {
            const { data, error } = await supabase
                .from('issue_types')
                .select(`*, categories (name)`)
                .eq('id', id)
                .single()
            if (error) throw error
            setIssueType(data)
        } catch (error) {
            console.error('Error fetching issue details:', error)
        }
    }

    async function fetchUrls(pageNum = 1, currentFilter = 'all', currentSortField = sortField, currentSortOrder = sortOrder) {
        try {
            setLoading(true)

            let countQuery = supabase
                .from('audit_urls')
                .select('*', { count: 'exact', head: true })
                .eq('issue_type_id', id)

            if (currentFilter !== 'all') {
                if (['critical', 'high', 'medium', 'low'].includes(currentFilter)) {
                    countQuery = countQuery.eq('priority', currentFilter)
                } else {
                    countQuery = countQuery.eq('status', currentFilter)
                }
            }

            const { count, error: countError } = await countQuery
            if (countError) throw countError
            setTotalUrls(count || 0)

            let dataQuery = supabase
                .from('audit_urls')
                .select('*')
                .eq('issue_type_id', id)

            // Handle sorting with NULLS handling
            // For scores, we usually want to see values first, so nullsFirst: false
            if (currentSortField !== 'created_at') {
                dataQuery = dataQuery.order(currentSortField, {
                    ascending: currentSortOrder === 'asc',
                    nullsFirst: false
                })
            } else {
                dataQuery = dataQuery.order(currentSortField, { ascending: currentSortOrder === 'asc' })
            }

            if (currentFilter !== 'all') {
                if (['critical', 'high', 'medium', 'low'].includes(currentFilter)) {
                    dataQuery = dataQuery.eq('priority', currentFilter)
                } else {
                    dataQuery = dataQuery.eq('status', currentFilter)
                }
            }

            const from = (pageNum - 1) * ITEMS_PER_PAGE
            const to = from + ITEMS_PER_PAGE - 1

            const { data, error } = await dataQuery.range(from, to)
            if (error) throw error

            setUrls(data || [])
        } catch (error) {
            console.error('Error fetching urls:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newPage) => {
        setPage(newPage)
        fetchUrls(newPage, filter, sortField, sortOrder)
    }

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter)
        setPage(1)
        fetchUrls(1, newFilter, sortField, sortOrder)
    }

    const handleSortChange = (field) => {
        const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
        setSortField(field)
        setSortOrder(newOrder)
        setPage(1)
        fetchUrls(1, filter, field, newOrder)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading || !session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando datos...</p>
                </div>
            </div>
        )
    }

    if (!issueType) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-gray-200">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Error no encontrado</h1>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">
                        Volver al dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const stats = {
        total: urls.length,
        fixed: urls.filter(u => u.status === 'fixed').length,
        pending: urls.filter(u => u.status === 'pending').length,
        ignored: urls.filter(u => u.status === 'ignored').length
    }

    const progress = stats.total > 0 ? Math.round((stats.fixed / stats.total) * 100) : 0

    const priorityConfig = {
        High: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertOctagon },
        Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
        Low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Activity }
    }[issueType.priority] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Activity }

    const PriorityIcon = priorityConfig.icon

    return (
        <>
            <Head>
                <title>{issueType.title} - Auditoría SEO Caldea</title>
            </Head>

            <div className="min-h-screen text-gray-200 pb-20">
                {/* Header Content Wrapper for Back Link */}
                <div className="container mx-auto px-6 py-6">
                    <Link href="/" className="text-gray-400 hover:text-white text-sm font-medium mb-4 inline-flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                    </Link>

                    {/* Issue Header Card */}
                    <GlassCard className="mb-8 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-bold text-white tracking-tight">{issueType.title}</h2>
                                        <span className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center gap-2 ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}>
                                            <PriorityIcon className="w-3.5 h-3.5" />
                                            {issueType.priority === 'High' ? 'ALTA' : issueType.priority === 'Medium' ? 'MEDIA' : 'BAJA'}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-lg leading-relaxed max-w-3xl opacity-90">{issueType.description}</p>
                                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Categoría</span>
                                        <span className="text-sm text-gray-200 font-medium">{issueType.categories?.name}</span>
                                    </div>
                                </div>

                                {/* Mini Stats */}
                                <div className="flex gap-4">
                                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10 min-w-[80px]">
                                        <div className="text-2xl font-bold text-white">{stats.fixed}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Corregidos</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10 min-w-[80px]">
                                        <div className="text-2xl font-bold text-white">{stats.pending}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Pendientes</div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-sm font-medium text-gray-300">Progreso Total</span>
                                    <span className={`text-2xl font-bold ${progress === 100 ? 'text-green-400' : 'text-blue-400'}`}>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* URL Fixer Component */}
                    <URLFixer
                        urls={urls}
                        user={session.user}
                        onUpdate={() => fetchUrls(page, filter, sortField, sortOrder)}
                        issueTypeId={id}
                        currentPage={page}
                        onPageChange={handlePageChange}
                        filter={filter}
                        onFilterChange={handleFilterChange}
                        totalCount={totalUrls}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSortChange={handleSortChange}
                    />
                </div>
            </div>
        </>
    )
}
