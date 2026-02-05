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
                    <title>Login - Auditoría SEO Caldea</title>
                    <meta name="description" content="Sistema de gestión de auditoría SEO" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>

                <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
                    {/* Background Ethereal Elements */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

                    <div className="w-full max-w-md relative z-10">
                        <GlassCard className="p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    Auditoría SEO Caldea
                                </h1>
                                <p className="text-gray-400">
                                    {isSignUp ? 'Crear nueva cuenta' : 'Inicia sesión para continuar'}
                                </p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyUp={checkCapsLock}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {capsLockActive && (
                                        <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                                            <AlertCircle size={14} />
                                            Bloqueo de Mayúsculas activado
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-start gap-2">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5"
                                >
                                    {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                                </button>
                            </form>

                            <div className="mt-8 text-center border-t border-white/10 pt-6">
                                <button
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
                                >
                                    {isSignUp
                                        ? '¿Ya tienes cuenta? Inicia sesión'
                                        : '¿No tienes cuenta? Regístrate'}
                                </button>
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

            <div className="min-h-screen text-gray-200 relative">
                {/* Background Ethereal Elements for Dashboard */}
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

                {/* Header */}
                <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* Migration Ring/Logo Placeholder */}
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                <span className="text-xs font-bold text-blue-400">SEO</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-tight">Caldea Audit</h1>
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider">Migration Protocol</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-gray-400 font-medium hidden sm:block">
                                {session.user.email}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:text-white"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard */}
                <AuditDashboard session={session} />
            </div>
        </>
    )
}
