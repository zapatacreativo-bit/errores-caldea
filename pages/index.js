import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AuditDashboard from '../components/AuditDashboard'
import GlassCard from '../components/ui/GlassCard'
import Head from 'next/head'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Home() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [capsLockActive, setCapsLockActive] = useState(false)
    const [showLoginForm, setShowLoginForm] = useState(false)
    useEffect(() => {
        // Verificar sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleAuth = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (error) {
            let userFriendlyMessage = error.message

            if (error.message.includes('Invalid login credentials')) {
                userFriendlyMessage = 'Email o contraseña incorrectos.'
            } else if (error.message.includes('User already registered')) {
                userFriendlyMessage = 'Este email ya está registrado.'
            } else if (error.message.includes('Password should be')) {
                userFriendlyMessage = 'La contraseña debe tener al menos 6 caracteres.'
            } else if (error.message.includes('Email not confirmed')) {
                userFriendlyMessage = 'Email no confirmado. Por favor, revisa tu correo.'
            }

            setError(userFriendlyMessage)
        }
    }

    const checkCapsLock = (e) => {
        if (e.getModifierState('CapsLock')) {
            setCapsLockActive(true)
        } else {
            setCapsLockActive(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <>
                <Head>
                    <title>Acceso - Auditoría SEO Caldea</title>
                    <meta name="description" content="Sistema de gestión de auditoría SEO" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>

                <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
                    {/* Background Ethereal Elements */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

                    <div className="w-full max-w-lg relative z-10">
                        <GlassCard className="min-h-[500px] flex items-center justify-center">
                            <div className="p-2 w-full">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
                                    <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mt-1">Protocolo de Auditoría</p>
                                </div>

                                <form onSubmit={handleAuth} className="space-y-4 text-left">
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Identificador (Email)
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="user@caldea.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Código de Acceso
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyUp={checkCapsLock}
                                                required
                                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none pr-12"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {capsLockActive && (
                                            <div className="mt-2 flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                                <AlertCircle size={12} />
                                                BLOQUEO DE MAYÚSCULAS ACTIVO
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-xl text-xs font-medium flex items-start gap-2 animate-pulse">
                                            <AlertCircle size={16} className="shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black py-4 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(37,99,235,0.4)] uppercase tracking-widest text-sm"
                                    >
                                        {isSignUp ? 'Generar Credenciales' : 'Validar Identidad'}
                                    </button>
                                </form>

                                <div className="mt-6 text-center border-t border-white/5 pt-4">
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                                    >
                                        {isSignUp
                                            ? '¿Ya tienes acceso? Volver al Login'
                                            : '¿Sin credenciales? Solicitar Registro'}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Head>
                <title>Dashboard - Auditoría SEO Caldea</title>
                <meta name="description" content="Sistema de gestión de auditoría SEO para Caldea.com" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            {/* Dashboard content only - Layout provided by _app.js */}
            <AuditDashboard session={session} />
        </>
    )
}
