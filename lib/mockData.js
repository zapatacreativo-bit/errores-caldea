// Mock data para demo local
export const mockIssueTypes = [
    {
        id: 1,
        title: 'Errores 4xx (Enlaces rotos)',
        priority: 'High',
        description: 'Enlaces rotos hacia recursos internos o externos que devuelven error 404.',
        category_name: 'Indexación',
        total_count: 2985,
        fixed_count: 245,
        pending_count: 2740,
        ignored_count: 0
    },
    {
        id: 2,
        title: 'Errores 5xx (Servidor)',
        priority: 'High',
        description: 'Errores del servidor que impiden el acceso a recursos.',
        category_name: 'Indexación',
        total_count: 1,
        fixed_count: 0,
        pending_count: 1,
        ignored_count: 0
    },
    {
        id: 3,
        title: 'Títulos duplicados',
        priority: 'High',
        description: 'Mismo título <title> en múltiples páginas.',
        category_name: 'Contenido',
        total_count: 85,
        fixed_count: 12,
        pending_count: 73,
        ignored_count: 0
    },
    {
        id: 4,
        title: 'Títulos vacíos',
        priority: 'High',
        description: 'Páginas sin etiqueta <title>.',
        category_name: 'Contenido',
        total_count: 29,
        fixed_count: 5,
        pending_count: 24,
        ignored_count: 0
    },
    {
        id: 5,
        title: 'Imágenes rotas',
        priority: 'High',
        description: 'Imágenes que devuelven error de carga.',
        category_name: 'Imágenes',
        total_count: 71,
        fixed_count: 8,
        pending_count: 63,
        ignored_count: 0
    },
    {
        id: 6,
        title: 'Páginas restringidas (Robots/Noindex)',
        priority: 'Medium',
        description: 'Páginas bloqueadas por robots.txt o meta noindex.',
        category_name: 'Indexación',
        total_count: 15001,
        fixed_count: 1200,
        pending_count: 13801,
        ignored_count: 0
    },
    {
        id: 7,
        title: 'Redirecciones 302 (Temporales)',
        priority: 'Medium',
        description: 'Redirecciones temporales que deberían ser permanentes (301).',
        category_name: 'Técnico',
        total_count: 389,
        fixed_count: 45,
        pending_count: 344,
        ignored_count: 0
    },
    {
        id: 8,
        title: 'Cadenas de redirección largas',
        priority: 'Medium',
        description: 'Múltiples redirecciones en cadena que afectan el rendimiento.',
        category_name: 'Técnico',
        total_count: 466,
        fixed_count: 32,
        pending_count: 434,
        ignored_count: 0
    },
    {
        id: 9,
        title: 'Meta descripciones duplicadas',
        priority: 'Medium',
        description: 'Misma meta description en varias páginas.',
        category_name: 'Contenido',
        total_count: 76,
        fixed_count: 10,
        pending_count: 66,
        ignored_count: 0
    },
    {
        id: 10,
        title: 'Texto ALT vacío',
        priority: 'Medium',
        description: 'Imágenes sin descripción alternativa (atributo alt).',
        category_name: 'Imágenes',
        total_count: 42092,
        fixed_count: 3500,
        pending_count: 38592,
        ignored_count: 0
    },
    {
        id: 11,
        title: 'Enlaces de retorno perdidos (Hreflang)',
        priority: 'Medium',
        description: 'Etiquetas hreflang sin reciprocidad.',
        category_name: 'Localización',
        total_count: 401,
        fixed_count: 50,
        pending_count: 351,
        ignored_count: 0
    },
    {
        id: 12,
        title: 'Falta valor "x-default" (Hreflang)',
        priority: 'Medium',
        description: 'Ausencia de etiqueta x-default en implementación hreflang.',
        category_name: 'Localización',
        total_count: 258,
        fixed_count: 25,
        pending_count: 233,
        ignored_count: 0
    },
    {
        id: 13,
        title: 'Redirecciones 301 (Permanentes)',
        priority: 'Low',
        description: 'Redirecciones permanentes que deben verificarse.',
        category_name: 'Técnico',
        total_count: 1376,
        fixed_count: 150,
        pending_count: 1226,
        ignored_count: 0
    },
    {
        id: 14,
        title: 'Títulos/Metas demasiado largos',
        priority: 'Low',
        description: 'Títulos o descripciones que exceden la longitud recomendada.',
        category_name: 'Contenido',
        total_count: 240,
        fixed_count: 30,
        pending_count: 210,
        ignored_count: 0
    }
]

export const mockUrls = {
    1: [ // Errores 4xx
        {
            id: 1,
            url: 'https://caldea.com/video-vimeo-eliminado-1',
            linked_from: 'https://caldea.com/blog/articulo-spa',
            status: 'pending',
            notes: null
        },
        {
            id: 2,
            url: 'https://caldea.com/video-vimeo-eliminado-2',
            linked_from: 'https://caldea.com/blog/articulo-piscinas',
            status: 'fixed',
            notes: 'Video reemplazado por versión actualizada'
        },
        {
            id: 3,
            url: 'https://facebook.com/caldea/video-no-disponible',
            linked_from: 'https://caldea.com/redes-sociales',
            status: 'pending',
            notes: null
        },
        {
            id: 4,
            url: 'https://caldea.com/promocion-antigua-2023',
            linked_from: 'https://caldea.com/ofertas',
            status: 'ignored',
            notes: 'Promoción expirada, se eliminará el enlace'
        }
    ],
    3: [ // Títulos duplicados
        {
            id: 10,
            url: 'https://caldea.com/spa/masajes',
            linked_from: 'https://caldea.com/servicios',
            status: 'pending',
            notes: null
        },
        {
            id: 11,
            url: 'https://caldea.com/spa/tratamientos',
            linked_from: 'https://caldea.com/servicios',
            status: 'pending',
            notes: null
        }
    ],
    5: [ // Imágenes rotas
        {
            id: 20,
            url: 'https://caldea.com/images/spa-1.jpg',
            linked_from: 'https://caldea.com/servicios/spa',
            status: 'fixed',
            notes: 'Imagen restaurada desde backup'
        },
        {
            id: 21,
            url: 'https://caldea.com/images/piscina-2.jpg',
            linked_from: 'https://caldea.com/instalaciones',
            status: 'pending',
            notes: null
        }
    ]
}

export const mockUser = {
    id: 'demo-user-123',
    email: 'demo@caldea.com'
}
