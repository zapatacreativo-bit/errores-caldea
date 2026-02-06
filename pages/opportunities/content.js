import { supabase } from '../../lib/supabaseClient'
import OpportunityTable from '../../components/OpportunityTable'
import DashboardLayout from '../../components/DashboardLayout'
import { FileText } from 'lucide-react'

export default function ContentPage() {
    return (
        <OpportunityTable
            title="Enriquecer Contenido (Thin Content)"
            description="Páginas con menos de 300 palabras. El contenido pobre no posiciona y puede afectar a la calidad global del dominio. ¡Dales 'chicha' o elimínalas!"
            icon={FileText}
            fetchDataFn={async ({ page, itemsPerPage, search, sortConfig }) => {
                let query = supabase
                    .from('audit_urls')
                    .select('*', { count: 'exact' })
                    .lt('word_count', 300)
                    .eq('indexability', 'Indexable') // Only indexable thin content matters most

                if (search) {
                    query = query.ilike('url', `%${search}%`)
                }

                // Apply sorting
                if (sortConfig && sortConfig.key) {
                    // Handle special logic if needed or direct mapping
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
                } else {
                    query = query.order('word_count', { ascending: true })
                }

                query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

                return await query
            }}
            columns={[
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
                    header: 'Palabras',
                    sortKey: 'word_count',
                    render: (row) => (
                        <div className="flex justify-center">

                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${row.word_count < 100
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>
                                {row.word_count} palabras
                            </span>
                        </div>
                    )
                },
                {
                    header: 'Tipo',
                    render: (row) => (
                        <span className="text-gray-500 text-xs uppercase font-bold text-center block">
                            {row.content_type?.split('/')[1] || 'HTML'}
                        </span>
                    )
                }
            ]}
        />
    )
}

ContentPage.getLayout = function getLayout(page) {
    return <DashboardLayout session={page.props.session}>{page}</DashboardLayout>
}
