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
            fetchDataFn={async ({ page, itemsPerPage, search }) => {
                let query = supabase
                    .from('audit_urls')
                    .select('*', { count: 'exact' })
                    .lt('word_count', 300)
                    .gt('word_count', 0) // Exclude 0 (redirects/errors usually)
                    .eq('status_code', 200) // Only valid pages
                    .order('word_count', { ascending: true })
                    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

                if (search) {
                    query = query.ilike('url', `%${search}%`)
                }

                return await query
            }}
            columns={[
                {
                    header: 'Palabras',
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
