import { http, HttpResponse } from 'msw'
const CATALOG_ROOT = "./tests/mocks/example_catalog/"

export const handlers = [ 
    http.get('https://mock-catalog.api/api/stac/v1/*segments', async ({ params }) => {
        // map routing to the static json files
        console.warn("this won't log")
        const subpath = params.segments.length == 0 ? "catalog.json" : params.segments.join("/");
        try {
            const filePath = CATALOG_ROOT + subpath;
            const response = await import(filePath, { with: { type: 'json' } });
            return HttpResponse.json(response.default);
        } catch (error) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
    }),
]
