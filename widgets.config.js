import { defineAsyncComponent } from 'vue';

// Cal-Adapt components live in src/caladapt/ and are placed on pages here,
// so upstream STAC Browser files stay unchanged where possible.
export default {
  'view-catalog-intro-end': [
    {
      id: 'CollectionOverview',
      component: defineAsyncComponent(() => import('./src/caladapt/CollectionOverview.vue')),
      condition: ({ data }) => Boolean(data?.isCollection)
    }
  ]
};
