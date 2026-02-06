import { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';

export default function PixelArtBreak() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger reminder every 2 hours (2 * 60 * 60 * 1000 ms)
        const timer = setInterval(() => {
            setIsVisible(true);
        }, 2 * 60 * 60 * 1000);

        // Demo mode: uncomment next line to see it in 5 seconds
        // setTimeout(() => setIsVisible(true), 3000);

        return () => clearInterval(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Retro CRT Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                    backgroundSize: '100% 2px, 3px 100%'
                }}
            />

            <div className="relative border-4 border-white p-8 max-w-2xl w-full mx-4 text-center font-mono shadow-[0_0_50px_rgba(59,130,246,0.5)] bg-blue-900/20">
                {/* Pixel Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white" />

                {/* Content */}
                <div className="space-y-8 animate-pulse">
                    <div className="flex justify-center">
                        <Coffee className="w-24 h-24 text-yellow-400" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-bold text-white tracking-widest leading-relaxed uppercase type-writer-effect">
                        ¡TIEMPO MUERTO!
                    </h2>

                    <div className="text-green-400 text-lg md:text-xl space-y-4 font-bold tracking-wide">
                        <p>Levántate y estira las piernas...</p>
                        <p>un pis?...un café?...</p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="mt-8 px-8 py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors border-2 border-transparent hover:border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none"
                    >
                        [ CONTINUAR ]
                    </button>

                    <p className="text-xs text-blue-300 mt-4 opacity-70">
                        PRESS START TO RESUME
                    </p>
                </div>
            </div>

            <style jsx>{`
                .type-writer-effect {
                    text-shadow: 2px 2px 0px #000;
                    font-family: 'Courier New', Courier, monospace; 
                }
            `}</style>
        </div>
    );
}
