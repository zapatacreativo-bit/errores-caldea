import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Check, X, RefreshCw, ExternalLink, AlertTriangle, ArrowUp, ArrowDown, Zap, Star } from 'lucide-react'

export default function URLFixer({
    urls,
    user,
    onUpdate,
    issueTypeId,
    currentPage,
    onPageChange,
    filter,
    onFilterChange,
    totalCount,
    sortField,
    sortOrder,
    onSortChange
}) {
    const [localUrls, setLocalUrls] = useState(urls)
    const [updating, setUpdating] = useState(null)

    // Dual Scroll Refs
    const topScrollRef = useRef(null)
    const tableScrollRef = useRef(null)

    useEffect(() => {
        setLocalUrls(urls)
    }, [urls])

    // Duplicate Detection for Issue Type 16 (On-Page SEO)
    const duplicates = useMemo(() => {
        if (parseInt(issueTypeId) !== 16) return { titles: new Set(), metas: new Set(), h1s: new Set() };

        const titleCount = {};
        const metaCount = {};
        const h1Count = {};

        localUrls.forEach(item => {
            const t = (item.page_title || '').trim().toLowerCase();
            const m = (item.meta_description || '').trim().toLowerCase();
            const h = (item.h1 || '').trim().toLowerCase();

            if (t) titleCount[t] = (titleCount[t] || 0) + 1;
            if (m) metaCount[m] = (metaCount[m] || 0) + 1;
            if (h) h1Count[h] = (h1Count[h] || 0) + 1;
        });

        return {
            titles: new Set(Object.keys(titleCount).filter(k => titleCount[k] > 1)),
            metas: new Set(Object.keys(metaCount).filter(k => metaCount[k] > 1)),
            h1s: new Set(Object.keys(h1Count).filter(k => h1Count[k] > 1))
        };
    }, [localUrls, issueTypeId]);

    // Sync Scrolls
    const handleTopScroll = () => {
        if (tableScrollRef.current && topScrollRef.current) {
            tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
        }
    }

    const handleTableScroll = () => {
        if (tableScrollRef.current && topScrollRef.current) {
            topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
        }
    }

    const getDisplayValues = (item) => {
        // Issue Type 16: On-Page SEO Audit (special columns)
        if (parseInt(issueTypeId) === 16) {
            return {
                mainUrl: item.url,
                secondaryUrl: null,
                secondaryLabel: null,
                isOnPageAudit: true,
                pageTitle: item.page_title || '',
                metaDescription: item.meta_description || '',
                h1: item.h1 || ''
            };
        }
        // Issue Type 15: Backlinks (swap URL/linked_from)
        if (parseInt(issueTypeId) === 15) {
            return {
                mainUrl: item.url, // External URL is now MAIN
                secondaryUrl: item.linked_from, // Target is Secondary
                secondaryLabel: 'Apunta a:',
                isOnPageAudit: false,
                showBadges: true, // New flag to force badges in main header
                trafficPercentage: item.traffic_percentage || 0,
                targetKeywords: item.target_keywords || null
            };
        }
        // Issue Type 7: Duplicate Titles
        if (parseInt(issueTypeId) === 7) {
            return {
                mainUrl: item.url,
                secondaryUrl: item.linked_from,
                secondaryLabel: 'Encontrado en:',
                isOnPageAudit: false,
                pageTitle: item.page_title,
                showBadges: false,
                trafficPercentage: 0,
                targetKeywords: null
            };
        }
        return {
            mainUrl: item.url,
            secondaryUrl: item.linked_from,
            secondaryLabel: 'Encontrado en:',
            isOnPageAudit: false,
            showBadges: false,
            trafficPercentage: 0,
            targetKeywords: null
        };
    };

    const toggleFix = async (id, currentStatus) => {
        setUpdating(id)
        const newStatus = currentStatus === 'fixed' ? 'pending' : 'fixed'
        const targetItem = localUrls.find(u => u.id === id)
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))

        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({
                    status: newStatus,
                    fixed_by: newStatus === 'fixed' ? user.id : null,
                    fixed_at: newStatus === 'fixed' ? new Date().toISOString() : null
                })
                .eq('id', id)

            if (error) throw error

            // Log activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                user_email: user.email,
                action_type: newStatus === 'fixed' ? 'check' : 'uncheck',
                target_id: id,
                target_url: targetItem?.url || '',
                issue_type_id: parseInt(issueTypeId),
                old_status: currentStatus,
                new_status: newStatus
            })

            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error actualizando:', error)
            setLocalUrls(urls)
            alert('Error al guardar.')
        } finally {
            setUpdating(null)
        }
    }

    const ignoreUrl = async (id) => {
        setUpdating(id)
        const targetItem = localUrls.find(u => u.id === id)
        const oldStatus = targetItem?.status || 'pending'
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'ignored' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'ignored' }).eq('id', id)
            if (error) throw error

            // Log activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                user_email: user.email,
                action_type: 'ignore',
                target_id: id,
                target_url: targetItem?.url || '',
                issue_type_id: parseInt(issueTypeId),
                old_status: oldStatus,
                new_status: 'ignored'
            })

            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            setLocalUrls(urls)
        } finally {
            setUpdating(null)
        }
    }

    const reactivateUrl = async (id) => {
        setUpdating(id)
        const targetItem = localUrls.find(u => u.id === id)
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'pending' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'pending' }).eq('id', id)
            if (error) throw error

            // Log activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                user_email: user.email,
                action_type: 'reactivate',
                target_id: id,
                target_url: targetItem?.url || '',
                issue_type_id: parseInt(issueTypeId),
                old_status: 'ignored',
                new_status: 'pending'
            })

            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            setLocalUrls(urls)
        } finally {
            setUpdating(null)
        }
    }

    const ITEMS_PER_PAGE = 50
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    const getRowStyle = (ts, as) => {
        const t = Number(ts) || 0;
        const a = Number(as) || 0;

        // 1. CRITICAL TOXIC (Mutant) - TS >= 60
        if (t >= 60) return 'bg-red-950/40 border-red-500/30 hover:bg-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]';

        // 2. DANGEROUS - TS 50-59
        if (t >= 50) return 'bg-red-900/20 border-red-500/20 hover:bg-red-800/30';

        // 3. BAD (Risky) - TS 40-49
        if (t >= 40) return 'bg-orange-900/20 border-orange-500/20 hover:bg-orange-800/30';

        // 4. SUSPICIOUS - TS 30-39
        if (t >= 30) return 'bg-yellow-900/10 border-yellow-500/20 hover:bg-yellow-800/20';

        // 5. LOW VALUE (Junk) - TS < 30 AND AS < 10
        if (a < 10) return 'bg-black/40 border-gray-700/30 hover:bg-gray-900/50 grayscale-[0.3]';

        // 6. STANDARD - TS < 30 AND AS 10-29
        if (a < 30) return 'bg-slate-900/30 border-slate-600/20 hover:bg-slate-800/40';

        // 7. GOOD AUTHORITY - TS < 30 AND AS 30-59
        if (a < 60) return 'bg-blue-950/20 border-blue-500/20 hover:bg-blue-900/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]';

        // 8. PREMIUM AUTHORITY (Elite) - TS < 30 AND AS >= 60
        return 'bg-indigo-950/30 border-indigo-400/30 hover:bg-indigo-900/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]';
    };

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Lista de URLs <span className="text-sm font-normal text-gray-400 bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{totalCount} total</span>
                    </h3>
                </div>

                {/* Filtros */}
                <div className="flex gap-4 flex-wrap bg-black/30 p-2 rounded-xl border border-white/5">
                    {['all', 'critical', 'high', 'medium', 'low', 'pending', 'fixed', 'ignored'].map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`mx-1 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${filter === f
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Todos' :
                                f === 'critical' ? '⚡ Críticos' :
                                    f === 'high' ? '🔥 Altos' :
                                        f === 'medium' ? '🔵 Medios' :
                                            f === 'low' ? '⚪ Bajos' :
                                                f === 'fixed' ? '✅ Listos' :
                                                    f === 'pending' ? '⏳ Pendientes' :
                                                        '🚫 Ignorados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sorting Toolbar */}
            <div className="bg-white/5 border-b border-white/5 px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Ordenar por:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onSortChange && onSortChange('url')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'url' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">🌍</span> Nombre / URL
                        {sortField === 'url' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                    <button
                        onClick={() => onSortChange && onSortChange('toxicity_score')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'toxicity_score' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">🧪</span> Toxicidad
                        {sortField === 'toxicity_score' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                    <button
                        onClick={() => onSortChange && onSortChange('authority_score')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'authority_score' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        <span className="text-base mr-1">👑</span> Autoridad
                        {sortField === 'authority_score' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>

                    {/* Traffic Sort - Only for Issue 15 (Backlinks) */}
                    {parseInt(issueTypeId) === 15 && (
                        <button
                            onClick={() => onSortChange && onSortChange('traffic_percentage')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${sortField === 'traffic_percentage' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            <span className="text-base mr-1">📈</span> Tráfico
                            {sortField === 'traffic_percentage' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </button>
                    )}
                </div>
            </div>

            {/* Top Scroll - Syncs with List */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto border-b border-white/5 bg-black/20"
                style={{ height: '12px' }}
            >
                <div style={{ width: '1200px', height: '1px' }}></div>
            </div>

            {/* Lista - Horizontal Scroll Enabled with Min Width to force scroll */}
            <div
                ref={tableScrollRef}
                onScroll={handleTableScroll}
                className="overflow-x-auto divide-y divide-white/5"
            >
                <div style={{ minWidth: '1200px' }}> {/* Force width to enable scroll */}
                    {localUrls.map((item) => {
                        const { mainUrl, secondaryUrl, secondaryLabel, isOnPageAudit, pageTitle, metaDescription, h1, showBadges, trafficPercentage, targetKeywords } = getDisplayValues(item);

                        // Star Rating Logic
                        const getStarRating = (as, ts) => {
                            const a = Number(as) || 0;
                            const t = Number(ts) || 0;

                            if (t >= 60) return 0; // Toxic = 0 stars
                            if (a >= 50 && t < 30) return 5; // Elite
                            if (a >= 30 && t < 40) return 4; // Great
                            if (a >= 15 && t < 50) return 3; // Good
                            if (a >= 5) return 2; // Average
                            if (a > 0) return 1; // Poor
                            return 0; // No value
                        };

                        const stars = getStarRating(item.authority_score, item.toxicity_score);

                        // Determine Row Style
                        let rowClass = '';

                        if (item.status === 'fixed') {
                            rowClass = 'bg-green-900/20 hover:bg-green-900/30 border-l-4 border-l-green-500';
                        } else if (item.status === 'ignored') {
                            rowClass = 'bg-gray-900/20 opacity-50 hover:opacity-80 border-l-4 border-l-gray-600';
                        } else {
                            // Apply Color Rule if not fixed/ignored
                            // Add border-l-4 to indicate status color even more clearly
                            const baseStyle = getRowStyle(item.toxicity_score, item.authority_score);
                            rowClass = `${baseStyle} border-l-4`;

                            // Dynamic Border Left Color matching the bg theme (approx)
                            if (item.toxicity_score >= 60) rowClass += ' border-l-red-600';
                            else if (item.toxicity_score >= 50) rowClass += ' border-l-red-500';
                            else if (item.toxicity_score >= 40) rowClass += ' border-l-orange-500';
                            else if (item.toxicity_score >= 30) rowClass += ' border-l-yellow-500';
                            else if ((Number(item.authority_score) || 0) < 10) rowClass += ' border-l-gray-700';
                            else if ((Number(item.authority_score) || 0) < 30) rowClass += ' border-l-slate-500';
                            else if ((Number(item.authority_score) || 0) < 60) rowClass += ' border-l-blue-500';
                            else rowClass += ' border-l-indigo-400';
                        }

                        return (
                            <div
                                key={item.id}
                                className={`p-5 transition-all duration-200 group border-b border-white/5 ${rowClass} ${updating === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-3 mb-1">
                                            <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-400 hover:text-blue-300 hover:underline truncate block max-w-full md:max-w-xl transition-colors flex items-center gap-1.5">
                                                {mainUrl} <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                            </a>

                                            {/* PRIORITY BADGE */}
                                            {item.priority && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${item.priority === 'critical' ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse' :
                                                    item.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                        item.priority === 'medium' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                    }`}>
                                                    {item.priority === 'critical' && <Zap size={10} fill="currentColor" />}
                                                    {item.priority}
                                                </span>
                                            )}

                                            {/* AS/TS Badges for On-Page SEO or Backlinks */}
                                            {(isOnPageAudit || showBadges) && (
                                                <div className="flex items-center gap-2">
                                                    {(item.toxicity_score !== null && item.toxicity_score !== undefined) && (
                                                        (() => {
                                                            const score = Number(item.toxicity_score);
                                                            const badgeStyle = score >= 60
                                                                ? 'bg-red-950/40 border-red-500/30 text-red-300'
                                                                : score >= 30
                                                                    ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-300'
                                                                    : 'bg-green-950/40 border-green-500/30 text-green-300';
                                                            return (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${badgeStyle}`}>
                                                                    🧪 TS: {score}
                                                                </span>
                                                            );
                                                        })()
                                                    )}
                                                    {(item.authority_score !== null && item.authority_score !== undefined) && (
                                                        (() => {
                                                            const score = Number(item.authority_score);
                                                            const badgeStyle = score >= 40
                                                                ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                                                                : score >= 20
                                                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                                                    : 'bg-white/5 border-white/10 text-gray-300';
                                                            return (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${badgeStyle}`}>
                                                                    👑 AS: {score}
                                                                </span>
                                                            );
                                                        })()
                                                    )}

                                                    {/* Elegant Star Rating */}
                                                    {stars > 0 && (
                                                        <div className="flex gap-0.5 items-center ml-2 bg-yellow-500/5 px-1.5 py-0.5 rounded border border-yellow-500/10" title={`${stars} Estrellas de Calidad`}>
                                                            {[...Array(stars)].map((_, i) => (
                                                                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Display Duplicate Title (Issue 7) */}
                                        {parseInt(issueTypeId) === 7 && pageTitle && (
                                            <p className="text-xs text-orange-200/70 mb-2 font-mono break-all pl-1 border-l-2 border-orange-500/20">
                                                Duplicate Title: "{pageTitle}"
                                            </p>
                                        )}

                                        {secondaryUrl && (
                                            <div className="flex flex-col gap-1.5 mt-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                                    <span className="text-[10px] uppercase tracking-wide font-bold text-gray-600 border border-white/5 bg-white/5 px-1.5 py-0.5 rounded">{secondaryLabel}</span>
                                                    <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline truncate max-w-full md:max-w-2xl transition-colors text-xs font-medium">{secondaryUrl}</a>

                                                    {/* Toxicity Badge - Mini (Only if NOT showing in main header) */}
                                                    {(!showBadges && item.toxicity_score !== null && item.toxicity_score !== undefined) && (
                                                        (() => {
                                                            const score = Number(item.toxicity_score);
                                                            const isHigh = score >= 60;
                                                            const isMedium = score >= 30 && score < 60;

                                                            const badgeStyle = isHigh
                                                                ? 'bg-red-950/40 border-red-500/30 text-red-300'
                                                                : isMedium
                                                                    ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-300'
                                                                    : 'bg-green-950/40 border-green-500/30 text-green-300';

                                                            return (
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ml-2 ${badgeStyle}`}>
                                                                    <span>🧪 TS: {score}</span>
                                                                </span>
                                                            );
                                                        })()
                                                    )}

                                                    {/* Authority Score Badge - Mini (Only if NOT showing in main header) */}
                                                    {(!showBadges && item.authority_score !== null && item.authority_score !== undefined) && (
                                                        (() => {
                                                            const score = Number(item.authority_score);
                                                            const isHigh = score >= 40;
                                                            const isMedium = score >= 20 && score < 40;

                                                            const badgeStyle = isHigh
                                                                ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                                                                : isMedium
                                                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                                                    : 'bg-white/5 border-white/10 text-gray-300';

                                                            return (
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}>
                                                                    👑 AS: {score}
                                                                </span>
                                                            );
                                                        })()
                                                    )}
                                                </div>

                                                {/* Traffic Data Visualization */}
                                                {(trafficPercentage > 0 || targetKeywords) && (
                                                    <div className="flex flex-col gap-1 ml-1 pl-2 border-l border-white/10 mt-0.5">
                                                        {/* Traffic Percentage Badge */}
                                                        {trafficPercentage > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] uppercase tracking-wide font-bold text-emerald-400 flex items-center gap-1">
                                                                    📈 Tráfico Potencial:
                                                                </span>
                                                                <span className="text-xs font-bold text-white bg-emerald-950/30 px-1.5 rounded border border-emerald-500/20">
                                                                    {Number(trafficPercentage).toFixed(2)}%
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Top Keywords List */}
                                                        {targetKeywords && (
                                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                                {(() => {
                                                                    try {
                                                                        const kws = JSON.parse(targetKeywords);
                                                                        return kws.map((kw, i) => (
                                                                            <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400 hover:text-gray-300 transition-colors cursor-default">
                                                                                {kw}
                                                                            </span>
                                                                        ));
                                                                    } catch (e) { return null; }
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* On-Page SEO Columns (Issue Type 16) */}
                                        {isOnPageAudit && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {/* Title Column */}
                                                {(() => {
                                                    const isDuplicate = duplicates.titles.has((pageTitle || '').trim().toLowerCase());
                                                    return (
                                                        <div className={`bg-white/5 border rounded-lg p-3 ${isDuplicate ? 'border-red-500/50 bg-red-950/20' : 'border-white/10'}`}>
                                                            <span className="text-[10px] uppercase tracking-wide font-bold text-blue-400 block mb-1">
                                                                📄 Título {isDuplicate && <span className="text-red-400 ml-1" title="Duplicado">💀</span>}
                                                            </span>
                                                            <p className={`text-sm ${isDuplicate ? 'text-red-300' : pageTitle.length > 60 ? 'text-orange-300' : 'text-gray-200'}`}>
                                                                {pageTitle || <span className="text-red-400 italic">Sin título</span>}
                                                            </p>
                                                            {pageTitle && (
                                                                <span className={`text-[10px] mt-1 block ${pageTitle.length > 60 ? 'text-orange-400' : 'text-gray-500'}`}>
                                                                    {pageTitle.length}/60 chars
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Meta Description Column */}
                                                {(() => {
                                                    const isDuplicate = duplicates.metas.has((metaDescription || '').trim().toLowerCase());
                                                    return (
                                                        <div className={`bg-white/5 border rounded-lg p-3 ${isDuplicate ? 'border-red-500/50 bg-red-950/20' : 'border-white/10'}`}>
                                                            <span className="text-[10px] uppercase tracking-wide font-bold text-purple-400 block mb-1">
                                                                📝 Meta Descripción {isDuplicate && <span className="text-red-400 ml-1" title="Duplicado">💀</span>}
                                                            </span>
                                                            <p className={`text-sm line-clamp-2 ${isDuplicate ? 'text-red-300' : metaDescription.length > 160 ? 'text-orange-300' : 'text-gray-200'}`}>
                                                                {metaDescription || <span className="text-red-400 italic">Sin meta</span>}
                                                            </p>
                                                            {metaDescription && (
                                                                <span className={`text-[10px] mt-1 block ${metaDescription.length > 160 ? 'text-orange-400' : 'text-gray-500'}`}>
                                                                    {metaDescription.length}/160 chars
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* H1 Column */}
                                                {(() => {
                                                    const isDuplicate = duplicates.h1s.has((h1 || '').trim().toLowerCase());
                                                    return (
                                                        <div className={`bg-white/5 border rounded-lg p-3 ${isDuplicate ? 'border-red-500/50 bg-red-950/20' : 'border-white/10'}`}>
                                                            <span className="text-[10px] uppercase tracking-wide font-bold text-green-400 block mb-1">
                                                                🏷️ H1 {isDuplicate && <span className="text-red-400 ml-1" title="Duplicado">💀</span>}
                                                            </span>
                                                            <p className={`text-sm ${isDuplicate ? 'text-red-300' : 'text-gray-200'}`}>
                                                                {h1 || <span className="text-red-400 italic">Sin H1</span>}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <p className="inline-flex items-center gap-2 text-xs text-yellow-200/80 bg-yellow-500/10 px-3 py-1.5 rounded mt-2 border border-yellow-500/20">
                                                <AlertTriangle className="w-3 h-3" />
                                                Note: {item.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <label className={`inline-flex items-center cursor-pointer select-none px-4 py-2 rounded-lg border transition-all ${item.status === 'fixed'
                                            ? 'bg-green-500/20 border-green-500/30 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}
                                                checked={item.status === 'fixed'}
                                                onChange={() => toggleFix(item.id, item.status)}
                                                disabled={updating === item.id || item.status === 'ignored'}
                                            />
                                            {item.status === 'fixed' ? <Check className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 mr-2 border-2 border-current rounded-sm" />}
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {item.status === 'fixed' ? 'VISTO' : <><span className="text-sm mr-1">👁️</span> VISTO</>}
                                            </span>
                                        </label>

                                        {item.status !== 'ignored' && (
                                            <button onClick={() => ignoreUrl(item.id)} disabled={updating === item.id} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Ignorar">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}

                                        {item.status === 'ignored' && (
                                            <button onClick={() => reactivateUrl(item.id)} disabled={updating === item.id} className="p-2 rounded-lg text-blue-500 hover:text-blue-300 hover:bg-blue-500/10 transition-colors" title="Reactivar">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        « Inicio
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Anterior
                    </button>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                    {/* Page Numbers Window (-5 to +5) */}
                    {(() => {
                        const windowSize = 5;
                        const start = Math.max(1, currentPage - windowSize);
                        const end = Math.min(totalPages || 1, currentPage + windowSize);
                        const pages = [];

                        for (let i = start; i <= end; i++) {
                            pages.push(
                                <button
                                    key={i}
                                    onClick={() => onPageChange(i)}
                                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${currentPage === i
                                        ? 'bg-blue-600 text-white shadow-lg scale-110 border border-blue-500'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {i}
                                </button>
                            );
                        }
                        return pages;
                    })()}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage >= totalPages ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Siguiente
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage >= totalPages ? 'text-gray-600 cursor-not-allowed bg-white/5' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`}
                    >
                        Fin »
                    </button>
                </div>
            </div>
        </div >
    )
}
