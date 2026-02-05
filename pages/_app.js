import '@/styles/globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <Component {...pageProps} />
        </QueryClientProvider>
    )
}
