import '@/styles/globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabaseClient'
import DashboardLayout from '../components/DashboardLayout'

export default function App({ Component, pageProps }) {
    const [queryClient] = useState(() => new QueryClient())
    const [session, setSession] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setAuthLoading(false)
        })

        // Auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            {session ? (
                <DashboardLayout session={session}>
                    <Component {...pageProps} session={session} />
                </DashboardLayout>
            ) : (
                <Component {...pageProps} />
            )}
        </QueryClientProvider>
    )
}
