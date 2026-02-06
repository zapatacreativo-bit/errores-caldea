import { supabase } from '../../lib/supabaseClient'
import OpportunityTable from '../../components/OpportunityTable'
import DashboardLayout from '../../components/DashboardLayout'
import { Layers } from 'lucide-react'

export default function DepthPage() {
    return (
        <OpportunityTable
            title="Optimizar Profundidad (Click Depth)"
            description="Páginas que están a más de 3 clics de la home. Son difíciles de encontrar para el usuario y para el bot de Google. Si son importantes, súbelas en la arquitectura."
            icon={Layers}
            fetchDataFn={async ({ page, itemsPerPage, search }) => {
                let query = supabase
                    .from('audit_urls')
                    .select('*', { count: 'exact' })
                    .gt('depth_level', 3)
                    .order('depth_level', { ascending: false })
                    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

                if (search) {
                    query = query.ilike('url', `%${search}%`)
                }

                return await query
            }}
            columns={[
                {
                    header: 'Nivel Profundidad',
                    render: (row) => (
                        <div className="flex justify-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {row.depth_level} clicks
                            </span>
                        </div>
                    )
                },
                {
                    header: 'Enlaces Internos',
                    render: (row) => (
                        <span className="text-gray-400 text-xs text-center block">
                            {row.internal_links_count}
                        </span>
                    )
                }
            ]}
        />
    )
}

DepthPage.getLayout = function getLayout(page) {
    return <DashboardLayout session={page.props.session}>{page}</DashboardLayout>
}
