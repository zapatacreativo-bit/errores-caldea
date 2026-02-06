import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Head from 'next/head'
import MigrationProgress from '../components/MigrationProgress'
import TechnicalChecklist from '../components/TechnicalChecklist'
import DeepAuditAnalysis from '../components/DeepAuditAnalysis'
import RedirectMapper from '../components/RedirectMapper'
import {
    LayoutDashboard, ArrowLeftRight, ClipboardCheck, BarChart3,
    Home, AlertTriangle, FileText
} from 'lucide-react'

export default function MigrationDashboard() {
    const router = useRouter()
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('progress')

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (!session) {
                router.push('/')
            } else {
                setLoading(false)
            }
        })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Migración SEO - CALDEA Dashboard</title>
            </Head>
            <div className="min-h-screen bg-[#050505] text-white">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <LayoutDashboard className="w-8 h-8 text-purple-500" />
                                <AlertTriangle className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Panel de Migración</h1>
                                <p className="text-xs text-gray-500">caldea.com → Nueva Plataforma</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Home className="w-4 h-4" /> Dashboard Principal
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveTab('progress')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'progress' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <BarChart3 className="w-4 h-4" /> Progreso
                        </button>
                        <button
                            onClick={() => setActiveTab('deep_audit')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'deep_audit' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <FileText className="w-4 h-4" /> Auditoría Profunda
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'checklist' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <ClipboardCheck className="w-4 h-4" /> Checklist Técnico
                        </button>
                        <button
                            onClick={() => setActiveTab('redirects')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'redirects' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <ArrowLeftRight className="w-4 h-4" /> Redirecciones
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'progress' && <MigrationProgress />}
                    {activeTab === 'deep_audit' && <DeepAuditAnalysis />}
                    {activeTab === 'checklist' && <TechnicalChecklist />}
                    {activeTab === 'redirects' && <RedirectMapper />}
                </div>
            </div>
        </>
    )
}
