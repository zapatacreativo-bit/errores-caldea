import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function URLFixer({
    urls,
    user,
    onUpdate,
    issueTypeId,
    // New Props for Server-Side Pagination
    currentPage,
    onPageChange,
    filter,
    onFilterChange,
    totalCount
}) {
    // State local solo para actualización optimista de items
    const [localUrls, setLocalUrls] = useState(urls)
    const [updating, setUpdating] = useState(null)

    // Sincronizar localUrls cuando cambian las props
    useEffect(() => {
        setLocalUrls(urls)
    }, [urls])

    // Helper display values
    const getDisplayValues = (item) => {
        if (parseInt(issueTypeId) === 15) {
            return {
                mainUrl: item.linked_from,
                secondaryUrl: item.url,
                secondaryLabel: 'Encontrado en (Origen):'
            };
        }
        return {
            mainUrl: item.url,
            secondaryUrl: item.linked_from,
            secondaryLabel: 'Encontrado en:'
        };
    };

    const toggleFix = async (id, currentStatus) => {
        setUpdating(id)
        const newStatus = currentStatus === 'fixed' ? 'pending' : 'fixed'

        // Optimist Update
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
            if (onUpdate) onUpdate() // Trigger refresh
        } catch (error) {
            console.error('Error actualizando:', error)
            setLocalUrls(urls) // Revert
            alert('Error al guardar.')
        } finally {
            setUpdating(null)
        }
    }

    const ignoreUrl = async (id) => {
        setUpdating(id)
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'ignored' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'ignored' }).eq('id', id)
            if (error) throw error
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
        setLocalUrls(prev => prev.map(u => u.id === id ? { ...u, status: 'pending' } : u))
        try {
            const { error } = await supabase.from('audit_urls').update({ status: 'pending' }).eq('id', id)
            if (error) throw error
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

    return (
        <div className="bg-white rounded-lg shadow-lg mt-6">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Lista de URLs Afectadas</h3>
                    <span className="text-sm text-gray-500">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + localUrls.length, totalCount)} de {totalCount} URLs
                    </span>
                </div>

                {/* Filtros Server-Side */}
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'fixed', 'ignored'].map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors uppercase ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <ul className="divide-y divide-gray-200">
                {localUrls.map((item) => {
                    const { mainUrl, secondaryUrl, secondaryLabel } = getDisplayValues(item);
                    return (
                        <li key={item.id} className={`p-5 transition-all duration-200 ${item.status === 'fixed' ? 'bg-green-50' : item.status === 'ignored' ? 'bg-gray-50' : 'hover:bg-blue-50'} ${updating === item.id ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-2xl" title={mainUrl}>{mainUrl}</a>

                                        {/* Toxicity Badge */}
                                        {item.toxicity_score !== null && item.toxicity_score !== undefined && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.toxicity_score >= 60 ? 'bg-red-100 text-red-800' : item.toxicity_score >= 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                Toxicidad: {item.toxicity_score}
                                            </span>
                                        )}
                                    </div>
                                    {secondaryUrl && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            <span className="font-semibold">{secondaryLabel}</span>{' '}
                                            <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{secondaryUrl}</a>
                                        </p>
                                    )}
                                    {item.notes && <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded mt-2 border-l-2 border-yellow-400">Note: {item.notes}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" className="form-checkbox h-6 w-6 text-green-600 rounded" checked={item.status === 'fixed'} onChange={() => toggleFix(item.id, item.status)} disabled={updating === item.id || item.status === 'ignored'} />
                                        <span className="ml-2 text-sm font-medium text-gray-600">{item.status === 'fixed' ? 'CORREGIDO' : 'PENDIENTE'}</span>
                                    </label>
                                    {item.status !== 'ignored' && <button onClick={() => ignoreUrl(item.id)} disabled={updating === item.id} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1">Ignorar</button>}
                                    {item.status === 'ignored' && <button onClick={() => reactivateUrl(item.id)} disabled={updating === item.id} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">Reactivar</button>}
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Anterior
                </button>
                <span className="text-sm text-gray-700">Página {currentPage} de {totalPages || 1}</span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    Siguiente
                </button>
            </div>
        </div>
    )
}
