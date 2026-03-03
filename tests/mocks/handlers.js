import { http, HttpResponse } from 'msw'
const CATALOG_ROOT = "./example_catalog/"

export const handlers = [ 
    http.get('https://mock-catalog.api/api/stac/v1/:segments+', async ({ params }) => {
        // map routing to the static json files
        
        console.warn("this won't log")
        let subpath = params.segments.join("/")
        if (params.segments.length == 0) {
           subpath = "catalog.json" 
        }
        try {
            const filePath = CATALOG_ROOT + subpath
            const response = await import(filePath, { with: { type: 'json' } })
            return HttpResponse.json(response.default)
        } catch (error) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }
    }),
]