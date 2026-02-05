import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function URLFixer({ urls, user, onUpdate, issueTypeId }) {
    // Estado local para UI optimista
    const [localUrls, setLocalUrls] = useState(urls)

    // ... (rest of logic) ... 

    // Helper to determine display values
    const getDisplayValues = (item) => {
        // Special case for Backlinks (ID 15): Swap "Found in" (Source) and "URL" (Target)
        // because user wants to see Caldea URL (Target) at top
        if (parseInt(issueTypeId) === 15) {
            return {
                mainUrl: item.linked_from, // Caldea URL (Target)
                secondaryUrl: item.url,    // External URL (Source)
                secondaryLabel: 'Encontrado en (Origen):'
            };
        }
        // Default behavior
        return {
            mainUrl: item.url,
            secondaryUrl: item.linked_from,
            secondaryLabel: 'Encontrado en:'
        };
    };
    const [updating, setUpdating] = useState(null)
    const [filter, setFilter] = useState('all') // all, pending, fixed, ignored

    const toggleFix = async (id, currentStatus) => {
        setUpdating(id)
        const newStatus = currentStatus === 'fixed' ? 'pending' : 'fixed'

        // Actualización Optimista en UI
        setLocalUrls(localUrls.map(u =>
            u.id === id ? { ...u, status: newStatus } : u
        ))

        try {
            // Actualización en BBDD Supabase
            const { error } = await supabase
                .from('audit_urls')
                .update({
                    status: newStatus,
                    fixed_by: newStatus === 'fixed' ? user.id : null,
                    fixed_at: newStatus === 'fixed' ? new Date().toISOString() : null
                })
                .eq('id', id)

            if (error) throw error

            // Notificar al componente padre para actualizar estadísticas
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error actualizando:', error)
            // Revertir si hay error
            setLocalUrls(urls)
            alert('Hubo un error al guardar el cambio. Por favor, intenta de nuevo.')
        } finally {
            setUpdating(null)
        }
    }

    const ignoreUrl = async (id) => {
        setUpdating(id)

        setLocalUrls(localUrls.map(u =>
            u.id === id ? { ...u, status: 'ignored' } : u
        ))

        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({ status: 'ignored' })
                .eq('id', id)

            if (error) throw error
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error:', error)
            setLocalUrls(urls)
            alert('Error al ignorar la URL.')
        } finally {
            setUpdating(null)
        }
    }

    const addNote = async (id, note) => {
        try {
            const { error } = await supabase
                .from('audit_urls')
                .update({ notes: note })
                .eq('id', id)

            if (error) throw error

            setLocalUrls(localUrls.map(u =>
                u.id === id ? { ...u, notes: note } : u
            ))
        } catch (error) {
            console.error('Error guardando nota:', error)
        }
    }

    const filteredUrls = localUrls.filter(url => {
        if (filter === 'all') return true
        return url.status === filter
    })

    const stats = {
        all: localUrls.length,
        pending: localUrls.filter(u => u.status === 'pending').length,
        fixed: localUrls.filter(u => u.status === 'fixed').length,
        ignored: localUrls.filter(u => u.status === 'ignored').length
    }

    return (
        <div className="bg-white rounded-lg shadow-lg mt-6">
            {/* Header con filtros */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Lista de URLs Afectadas</h3>
                    <span className="text-sm text-gray-500">
                        {filteredUrls.length} de {localUrls.length} URLs
                    </span>
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todos ({stats.all})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pendientes ({stats.pending})
                    </button>
                    <button
                        onClick={() => setFilter('fixed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'fixed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Corregidos ({stats.fixed})
                    </button>
                    <button
                        onClick={() => setFilter('ignored')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ignored'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Ignorados ({stats.ignored})
                    </button>
                </div>
            </div>

            {/* Lista de URLs */}
            <ul className="divide-y divide-gray-200">
                {filteredUrls.map((item) => {
                    const { mainUrl, secondaryUrl, secondaryLabel } = getDisplayValues(item);
                    return (
                        <li
                            key={item.id}
                            className={`p-5 transition-all duration-200 ${item.status === 'fixed' ? 'bg-green-50' :
                                item.status === 'ignored' ? 'bg-gray-50' :
                                    'hover:bg-blue-50'
                                } ${updating === item.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* URL Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <a
                                            href={mainUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-2xl"
                                            title={mainUrl}
                                        >
                                            {mainUrl}
                                        </a>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(mainUrl)}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                            title="Copiar URL"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {secondaryUrl && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            <span className="font-semibold">{secondaryLabel}</span>{' '}
                                            <a
                                                href={secondaryUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                {secondaryUrl}
                                            </a>
                                        </p>
                                    )}


                                    {/* Notas */}
                                    {item.notes && (
                                        <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded mt-2 border-l-2 border-yellow-400">
                                            <span className="font-semibold">Nota:</span> {item.notes}
                                        </p>
                                    )}
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-3">
                                    {/* Checkbox de Fix */}
                                    <label className="inline-flex items-center cursor-pointer select-none group">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-6 w-6 text-green-600 rounded focus:ring-green-500 border-gray-300 transition duration-150 ease-in-out cursor-pointer"
                                            checked={item.status === 'fixed'}
                                            onChange={() => toggleFix(item.id, item.status)}
                                            disabled={updating === item.id || item.status === 'ignored'}
                                        />
                                        <span className={`ml-2 text-sm font-medium transition-colors ${item.status === 'fixed' ? 'text-green-700' :
                                            item.status === 'ignored' ? 'text-gray-400' :
                                                'text-gray-600 group-hover:text-green-600'
                                            }`}>
                                            {item.status === 'fixed' ? '✓ CORREGIDO' :
                                                item.status === 'ignored' ? 'IGNORADO' :
                                                    'PENDIENTE'}
                                        </span>
                                    </label>

                                    {/* Botón Ignorar */}
                                    {item.status !== 'ignored' && (
                                        <button
                                            onClick={() => ignoreUrl(item.id)}
                                            disabled={updating === item.id}
                                            className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                                            title="Marcar como ignorado"
                                        >
                                            Ignorar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li >
                    )
                })
                }
            </ul >

            {/* Empty State */}
            {
                filteredUrls.length === 0 && (
                    <div className="p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">
                            {filter === 'fixed' ? '¡Aún no hay URLs corregidas!' :
                                filter === 'ignored' ? 'No hay URLs ignoradas.' :
                                    filter === 'pending' ? '¡Excelente! No hay URLs pendientes.' :
                                        'No hay URLs en esta categoría.'}
                        </p>
                    </div>
                )
            }
        </div >
    )
}
