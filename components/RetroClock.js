import { useState, useEffect } from 'react'

export default function RetroClock() {
    const [time, setTime] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const updateTime = () => {
            const now = new Date()
            setTime(now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }))
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        <div className="flex items-center justify-center px-3 py-1.5 bg-black/90 border border-[#39ff14]/40 rounded-lg shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            <span
                className="text-lg font-black tracking-[0.15em] text-[#39ff14] select-none"
                style={{
                    fontFamily: "'Orbitron', sans-serif",
                    transform: 'scaleX(-1)', // Mirrored effect
                    textShadow: '0 0 10px rgba(57, 255, 20, 0.9), 0 0 20px rgba(57, 255, 20, 0.5)'
                }}
            >
                {time}
            </span>
        </div>
    )
}
