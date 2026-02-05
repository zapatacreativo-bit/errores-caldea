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
                duration: 0.5,
                delay: delay,
                type: "spring",
                stiffness: 100
            }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10",
                "bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
                "p-6 transition-all duration-300",
                className
            )}
        >
            {/* Decorative Gradient Blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-4 relative z-10">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-white/10 text-blue-400 shadow-inner border border-white/5">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    {title && (
                        <h3 className="text-sm font-medium tracking-wide text-gray-300 uppercase">
                            {title}
                        </h3>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 text-gray-100">
                {children}
            </div>

            {/* Shiny Border Effect on Hover (Optional Overlay) */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
        </motion.div>
    );
};

export default GlassCard;
