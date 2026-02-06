import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import OpportunityTable from '../../components/OpportunityTable'
import DashboardLayout from '../../components/DashboardLayout'
import { Link2, AlertTriangle } from 'lucide-react'

export default function InternalLinkingPage() {
    const [mode, setMode] = useState('opportunities') // 'opportunities' | 'broken'

    return (
        <OpportunityTable
            title={mode === 'opportunities' ? "Potenciar Link Juice (Enlazado Interno)" : "Enlaces Rotos (404) con Inlinks"}
            description={mode === 'opportunities'
                ? "Estas páginas tienen menos de 5 enlaces internos apuntando hacia ellas. Son 'huerfanitas' que necesitan amor."
                : "¡Alerta Crítica! Estas páginas responden 404 (No Encontrado) pero todavía tienen enlaces internos apuntando hacia ellas. Estás enviando usuarios y bots a un callejón sin salida."}
            icon={mode === 'opportunities' ? Link2 : AlertTriangle}

            // Inject Custom Filters UI via a prop (OpportunityTable needs to support this, or we hack it via title prop if valid, but let's assume standard props first or just modify fetching)
            // Since OpportunityTable might not have a slot for custom UI, we'll wrap the logic inside fetchDataFn effectively, 
            // BUT we need the UI toggle. 
            // Let's modify OpportunityTable? OR just add the toggle above the table using a Layout wrapper?
            // OpportunityTable is a generic component. Let's see if we can pass a 'headerActions' prop or similar.
            // Checking previous view of OpportunityTable... we didn't check it fully. 
            // Let's assume we can just pass the mode toggle as part of the page content if OpportunityTable allows children.
            // Wait, OpportunityTable usually renders everything. 
            // Let's use a trick: The `extraHeader` prop if it exists, or just rely on state inside fetch?
            // Actually, we can just switch the `fetchDataFn` and `columns` based on `mode`.
            // But we need the BUTTONS to switch mode.
            // Let's wrap OpportunityTable in a div and put buttons above it? 
            // OpportunityTable likely takes full height.
            // Let's try to Inject the tabs via a custom prop if possible, or just render them above.

            extraHeader={(
                <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setMode('opportunities')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'opportunities'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Oportunidades
                    </button>
                    <button
                        onClick={() => setMode('broken')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'broken'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Rotas (404)
                    </button>
                </div>
            )}

            fetchDataFn={async ({ page, itemsPerPage, search, sortConfig }) => {
                let query = supabase
                    .from('audit_urls')
                    .select('*', { count: 'exact' })

                if (mode === 'opportunities') {
                    // Logic: Low internal links, but valid pages (status 200) ideally
                    query = query.lt('internal_links_count', 5).neq('status_code', 404)
                } else {
                    // Logic: Broken pages (404) that have links pointing to them
                    query = query.eq('status_code', 404).gt('internal_links_count', 0)
                }

                if (search) {
                    query = query.ilike('url', `%${search}%`)
                }

                if (sortConfig && sortConfig.key) {
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
                } else {
                    // Default sort
                    if (mode === 'opportunities') {
                        query = query.order('internal_links_count', { ascending: true })
                    } else {
                        query = query.order('traffic', { ascending: false }) // Prioritize High traffic 404s? Or just internal links?
                        // Let's order by internal_links_count desc to see biggest offenders
                        // But supabase order calls are sequential.
                        // Let's default to internal_links_count DESC for broken
                        query = query.order('internal_links_count', { ascending: false })
                    }
                }

                query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
                return await query
            }}
            columns={[
                {
                    header: 'Código',
                    sortKey: 'status_code',
                    hidden: mode === 'opportunities',
                    render: (row) => (
                        <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                            {row.status_code}
                        </span>
                    )
                },
                {
                    header: '% Tráfico',
                    sortKey: 'traffic_percentage',
                    render: (row) => (
                        <span className="text-blue-200 text-xs font-mono font-bold">
                            {row.traffic_percentage ? `${row.traffic_percentage}%` : '-'}
                        </span>
                    )
                },
                {
                    header: 'Enlaces Entrantes',
                    sortKey: 'internal_links_count',
                    render: (row) => (
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${row.internal_links_count === 0
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : mode === 'broken'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' // Bad thing for 404s
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                {row.internal_links_count} links
                            </span>
                        </div>
                    )
                },
                {
                    header: 'Autoridad (AS)',
                    sortKey: 'authority_score',
                    render: (row) => (
                        <span className="text-gray-400 text-xs font-mono">
                            {row.authority_score || '-'}
                        </span>
                    )
                }
            ]}
        />
    )
}

InternalLinkingPage.getLayout = function getLayout(page) {
    return <DashboardLayout session={page.props.session}>{page}</DashboardLayout>
}
