import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Users } from 'lucide-react'

export default function OnlineUsers({ session }) {
    const [users, setUsers] = useState({})
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!session?.user) return

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: session.user.id,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                setUsers(newState)
                setCount(Object.keys(newState).length)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Optional: Toast notification
                console.log('User joined:', key, newPresences)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track current user
                    await channel.track({
                        user_id: session.user.id,
                        email: session.user.email,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [session])

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner transition-all hover:bg-black/60">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30">
                <Users className="w-3.5 h-3.5 text-green-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>

            <span className="text-xs font-medium text-green-100 heading-wide">
                <span className="font-bold text-green-400 mr-1">{count}</span>
                {count === 1 ? 'Online' : 'Online'}
            </span>

            {/* Avatar Stack (Optional expansion) */}
            {count > 0 && (
                <div className="flex -space-x-1.5 ml-2">
                    {Object.values(users).slice(0, 3).map((u, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-black flex items-center justify-center text-[8px] text-white font-bold ring-2 ring-black/50" title={u[0].email}>
                            {u[0].email?.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {count > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-700 border border-black flex items-center justify-center text-[8px] text-gray-300 font-bold ring-2 ring-black/50">
                            +{count - 3}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
