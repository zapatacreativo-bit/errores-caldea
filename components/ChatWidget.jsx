import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MessageSquare, X, Send, Minus, User } from 'lucide-react'

export default function ChatWidget({ session }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const messagesEndRef = useRef(null)

    // Scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom()
            setUnreadCount(0)
        }
    }, [messages, isOpen, isMinimized])

    // Cargar historial y suscribirse a cambios
    useEffect(() => {
        if (!session?.user) return

        fetchMessages()

        const channel = supabase.channel('room-chat-db')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                },
                (payload) => {
                    const newMsg = payload.new
                    setMessages((prev) => [...prev, newMsg])

                    // Incrementar contador si está cerrado o minimizado
                    // Nota: Esto contará también tus propios mensajes si tienes varias pestañas, 
                    // se puede filtrar por user_id si se desea.
                    if (!isOpen || isMinimized) {
                        setUnreadCount(prev => prev + 1)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [session, isOpen, isMinimized])

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50)

        if (!error && data) {
            setMessages(data)
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!message.trim() || !session?.user) return

        const textToSend = message
        setMessage('') // Optimistic clear

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: session.user.id,
                email: session.user.email,
                text: textToSend
            })

        if (error) {
            console.error('Error sending message:', error)
            setMessage(textToSend) // Restore if failed
        }
    }

    // Formatear hora
    const formatTime = (isoString) => {
        if (!isoString) return ''
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (!session) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Ventana de Chat */}
            <div className={`
                pointer-events-auto
                transition-all duration-300 ease-in-out transform origin-bottom-right
                w-80 md:w-96
                bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden
                flex flex-col
                ${isOpen && !isMinimized ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none h-0'}
            `}
                style={{ height: '500px', maxHeight: '70vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <h3 className="font-bold text-white tracking-wide">Cuaderno de Bitácoras</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-10 italic">
                            Bitácora vacía.<br />Registra el primer evento. 🚀
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === session.user.id
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                        ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white/10 text-gray-100 rounded-bl-none border border-white/5'
                                        }
                                    `}>
                                        {!isMe && (
                                            <p className="text-[10px] text-blue-300 font-bold mb-1 block truncate">
                                                {msg.email?.split('@')[0]}
                                            </p>
                                        )}
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                                        {formatTime(msg.created_at || msg.timestamp)}
                                    </span>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Nueva entrada en bitácora..."
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/50 transition-all placeholder:text-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Botón Flotante (Cuando está cerrado o minimizado) */}
            {(!isOpen || isMinimized) && (
                <button
                    onClick={() => {
                        setIsOpen(true)
                        setIsMinimized(false)
                        setUnreadCount(0)
                    }}
                    className="group pointer-events-auto relative flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.3)] transition-all hover:scale-110 active:scale-95 border border-white/10"
                >
                    <MessageSquare className="w-6 h-6" />

                    {/* Badge de no leídos */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-[#050505] shadow-lg animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    {/* Tooltip */}
                    <span className="absolute right-full mr-4 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                        Cuaderno de Bitácoras
                    </span>
                </button>
            )}
        </div>
    )
}
