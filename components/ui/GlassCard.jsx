import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const GlassCard = ({
    children,
    className,
    title,
    icon: Icon,
    delay = 0,
    backContent, // Prop for the back of the card
    isFlipped = false, // New prop for manual flip control
    manualFlip = false  // Set to true to disable hover flip
}) => {
    // Shared Glass Styles for both Front and Back faces
    const glassStyles = cn(
        "absolute inset-0 h-full w-full rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
        "backdrop-blur-3xl border border-white/20",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
        "p-6",
        "[backface-visibility:hidden]"
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                delay: delay,
                type: "spring",
                stiffness: 80,
                damping: 15
            }}
            className={cn(
                "group relative [perspective:1000px]", // Removed fixed h-48
                className
            )}
        >
            {/* 3D Wrapper that rotates */}
            <div className={cn(
                "relative h-full w-full transition-all duration-700 [transform-style:preserve-3d]",
                // Flip on hover if not manual and backContent exists
                (!manualFlip && backContent) && "group-hover:[transform:rotateY(180deg)]",
                // Manual flip control
                isFlipped && "[transform:rotateY(180deg)]"
            )}>

                {/* === FRONT FACE === */}
                <div className={glassStyles}>
                    {/* Dynamic Glass Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] pointer-events-none" />

                    {/* Decorative Gradient Blob */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/40 transition-colors duration-500" />

                    {/* Inner "Thick Glass" Glow */}
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none group-hover:ring-white/30 transition-all duration-500" />

                    {/* Header */}
                    {(title || Icon) && (
                        <div className="relative z-10 flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                            {Icon && (
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-blue-300 shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-200 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                    <Icon className="w-5 h-5" />
                                </div>
                            )}
                            {title && (
                                <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400 uppercase group-hover:text-white transition-colors duration-300">
                                    {title}
                                </h3>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 text-gray-100 h-full">
                        {children}
                    </div>
                </div>

                {/* === BACK FACE === */}
                {backContent && (
                    <div className={cn(
                        glassStyles,
                        "[transform:rotateY(180deg)]",
                        "flex items-center justify-center text-center bg-black/60"
                    )}>
                        {/* Back Face Decoration */}
                        <div className="absolute inset-0 bg-gradient-to-tl from-red-600/20 to-transparent opacity-50 pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-500/20 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10 transform translate-z-10 w-full">
                            {backContent}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default GlassCard;
