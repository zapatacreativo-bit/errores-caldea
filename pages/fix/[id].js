import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import URLFixer from '../../components/URLFixer'
import Head from 'next/head'
import Link from 'next/link'

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

    useEffect(() => {
        if (id && session) {
            fetchData()
        }
    }, [id, session])

    async function fetchData() {
        try {
            // Obtener información del tipo de error
            const { data: issueData, error: issueError } = await supabase
                .from('issue_types')
                .select(`
          *,
          categories (name)
        `)
                .eq('id', id)
                .single()

            if (issueError) throw issueError
            setIssueType(issueData)

            // Obtener URLs afectadas
            const { data: urlsData, error: urlsError } = await supabase
                .from('audit_urls')
                .select('*')
                .eq('issue_type_id', id)
                .order('status', { ascending: true })
                .order('created_at', { ascending: false })

            if (urlsError) throw urlsError
            setUrls(urlsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
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
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!issueType) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Error no encontrado</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800">
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

    return (
        <>
            <Head>
                <title>{issueType.title} - Auditoría SEO Caldea</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div>
                            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
                                ← Volver al Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">Caldea SEO Audit</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{session.user.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="container mx-auto p-6">
                    {/* Issue Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{issueType.title}</h2>
                                    <span className={`py-1 px-3 rounded-full text-xs font-semibold ${issueType.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            issueType.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        Prioridad {issueType.priority === 'High' ? 'Alta' : issueType.priority === 'Medium' ? 'Media' : 'Baja'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-2">{issueType.description}</p>
                                <p className="text-sm text-gray-500">
                                    Categoría: <span className="font-medium">{issueType.categories?.name}</span>
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Progreso de Corrección</span>
                                <span className="text-sm font-bold text-gray-900">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600">
                                <span>Total: {stats.total}</span>
                                <span className="text-green-600 font-semibold">Corregidos: {stats.fixed}</span>
                                <span className="text-yellow-600">Pendientes: {stats.pending}</span>
                                <span className="text-gray-500">Ignorados: {stats.ignored}</span>
                            </div>
                        </div>
                    </div>

                    {/* URL Fixer Component */}
                    <URLFixer
                        urls={urls}
                        user={session.user}
                        onUpdate={fetchData}
                    />
                </div>
            </div>
        </>
    )
}
