import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import OnlineUsers from './OnlineUsers'
import ChatWidget from './ChatWidget'
import { getRandomQuote } from '../lib/quotes'
import { Power } from 'lucide-react'

export default function DashboardLayout({ children, session }) {
    const router = useRouter()
    const [quote, setQuote] = useState("Cargando sabiduría...")

    useEffect(() => {
        setQuote(getRandomQuote())
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        // Force reload to clear any state if needed, or rely on router
        window.location.reload()
    }

    return (
        <div className="min-h-screen text-gray-200 relative bg-[#050505]">
            {/* Background Ethereal Elements */}
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none fixed" />

            {/* Global Header */}
            <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-lg">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">

                    {/* Brand Section */}
                    <div className="flex items-center gap-4 z-10">
                        <Link href="/" className="group flex items-center gap-3">
                            <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-105">
                                <div className="absolute inset-0 bg-red-600/20 blur-md rounded-full"></div>
                                {/* Red Circle Logo */}
                                <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="#dc2626" strokeWidth="20" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-black text-white leading-none tracking-tight group-hover:text-red-500 transition-colors">
                                    SEO MADRID
                                </h1>
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                    Caldea Audit System
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* SEO Sage Quote (Persistent) - Marquee Style - Centered Absolute */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:block w-[921px] overflow-hidden mask-linear-fade pointer-events-none">
                        <style jsx>{`
                            @keyframes marquee {
                                0% { transform: translateX(100%); }
                                100% { transform: translateX(-100%); }
                            }
                            .animate-marquee {
                                animation: marquee 30s linear infinite;
                                white-space: nowrap;
                            }
                            .mask-linear-fade {
                                mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
                                -webkit-mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
                            }
                        `}</style>
                        <div className="animate-marquee inline-block">
                            <p className="text-xl text-gray-300 italic font-mono opacity-90 drop-shadow-md">
                                "{quote}"
                                <span className="text-blue-500 font-bold not-italic text-sm ml-3">
                                    - Sabio SEO 🎲
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Widgets & User */}
                    <div className="flex items-center gap-6 z-10">

                        {/* Online Users Widget (Persistent) */}
                        <div className="hidden md:block">
                            <OnlineUsers session={session} />
                        </div>

                        {/* User Profile & Logout */}
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <span className="text-xs text-gray-400 font-medium hidden lg:block">
                                {session?.user?.email}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-gray-400 hover:text-red-300 p-2 rounded-lg transition-all duration-300 group"
                                title="Cerrar Sesión"
                            >
                                <Power className="w-5 h-5 transition-transform group-hover:scale-110" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-0">
                {children}
            </main>

            {/* Persistent Chat Widget */}
            <ChatWidget session={session} />
        </div>
    )
}
