import { defineAsyncComponent } from 'vue';

// Cal-Adapt components live in src/caladapt/ and are placed on pages here,
// so upstream STAC Browser files stay unchanged where possible.
export default {
  // Map and Catalog tabs next to the header title (the hook is added to StacBrowser.vue).
  // VITE_MAP_URL points the Map tab elsewhere, e.g. http://localhost:5173/ for local testing.
  'header-title-end': [
    {
      id: 'SiteTabs',
      component: defineAsyncComponent(() => import('./src/caladapt/SiteTabs.vue')),
      props: {
        mapUrl: import.meta.env.VITE_MAP_URL ?? 'https://nicolekeeney.com/caladapt-stac-map/'
      }
    }
  ],
  // Replaces the fork's old collectionOrder option: these appear first on the landing page
  'view-catalog-catalogs-start': [
    {
      id: 'Featured',
      props: {
        entities: ['loca2', 'wrf-ucla', 'historical-data-platform', 'typical-met-year', 'standard-year', 'xmy-persist', 'xmy-shock']
      }
    }
  ],
  'view-catalog-intro-end': [
    {
      id: 'CollectionOverview',
      component: defineAsyncComponent(() => import('./src/caladapt/CollectionOverview.vue')),
      condition: ({ data }) => Boolean(data?.isCollection)
    }
  ]
};
