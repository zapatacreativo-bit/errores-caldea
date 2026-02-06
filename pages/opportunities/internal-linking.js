import { supabase } from '../../lib/supabaseClient'
import OpportunityTable from '../../components/OpportunityTable'
import DashboardLayout from '../../components/DashboardLayout'
import { Link2 } from 'lucide-react'

export default function InternalLinkingPage() { // Removed { session } since not passed here usually, but Layout needs it. 
    // Actually _app.js passes session to Component. 
    // So we should accept props.
    return (
        <OpportunityTable
            title="Potenciar Link Juice (Enlazado Interno)"
            description="Estas páginas tienen menos de 5 enlaces internos apuntando hacia ellas. Son 'huerfanitas' que necesitan amor para que Google las valore y rastree con frecuencia. ¡Conéctalas!"
            icon={Link2}
            fetchDataFn={async ({ page, itemsPerPage, search }) => {
                let query = supabase
                    .from('audit_urls')
                    .select('*', { count: 'exact' })
                    .lt('internal_links_count', 5)
                    .order('internal_links_count', { ascending: true })
                    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

                if (search) {
                    query = query.ilike('url', `%${search}%`)
                }

                return await query
            }}
            columns={[
                {
                    header: 'Enlaces Internos',
                    render: (row) => (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${row.internal_links_count === 0
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                            {row.internal_links_count} links
                        </span>
                    )
                },
                {
                    header: 'Autoridad (AS)',
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
