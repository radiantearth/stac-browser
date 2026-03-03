import { http, HttpResponse } from 'msw'
const CATALOG_ROOT = "./example_catalog/"

export const handlers = [ 
    http.get('https://mock-catalog.api/api/stac/v1/', async () => {
        // '/' = catalog.json
        const response = await import(CATALOG_ROOT + 'catalog.json', { with: { type: 'json' } })
        return HttpResponse.json(response.default)
    }),
    http.get('https://mock-catalog.api/api/stac/v1/:segments+', async ({ params }) => {
        // map routing to the static json files
        try {
            const subpath = params.segments.join("/")
            const filePath = CATALOG_ROOT + subpath
            const response = await import(filePath, { with: { type: 'json' } })
            return HttpResponse.json(response.default)
        } catch (error) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }
    })
]