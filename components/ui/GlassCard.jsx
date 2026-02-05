import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const GlassCard = ({
    children,
    className,
    title,
    icon: Icon,
    delay = 0
}) => {
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
            whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5)"
            }}
            className={cn(
                "group relative overflow-hidden rounded-3xl",
                "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
                "backdrop-blur-3xl border border-white/20",
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
                "transition-all duration-500",
                className
            )}
        >
            {/* Dynamic Glass Reflection (Stronger) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Shimmer Effect (High Contrast) */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] pointer-events-none" />

            {/* Decorative Gradient Blob (More Vibrant) */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/40 transition-colors duration-500" />

            {/* Inner "Thick Glass" Glow (Stronger Ring) */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none group-hover:ring-white/30 transition-all duration-500" />

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
            <div className="relative z-10 text-gray-100">
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
