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
        <div className="flex items-center justify-center px-2 py-0.5 bg-black/90 border border-[#39ff14]/30 rounded shadow-[0_0_5px_rgba(57,255,20,0.1)]">
            <span
                className="text-[10px] font-black tracking-[0.1em] text-[#39ff14] select-none"
                style={{
                    fontFamily: "'Orbitron', sans-serif",
                    transform: 'scaleX(-1)', // Mirrored effect
                    textShadow: '0 0 5px rgba(57, 255, 20, 0.8)'
                }}
            >
                {time}
            </span>
        </div>
    )
}
