<template>
  <Catalogs
    v-if="resolvedEntities.length > 0" class="featured"
    :catalogs="resolvedEntities" :title="heading" :enforceView="view"
    hideControls hideCount preserveOrder
  />
</template>

<script>
import { defineComponent } from 'vue';
import { mapGetters, mapState } from 'vuex';
import { Link, STAC } from 'stac-js';
import { toAbsolute } from 'stac-js/src/http.js';
import { hasText, isObject } from 'stac-js/src/utils.js';
import Catalogs from '../components/Catalogs.vue';
import { createSTAC } from '../models/stac';
import Utils from '../utils';

export default defineComponent({
  name: "Featured",
  components: {
    Catalogs
  },
  props: {
    entities: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      default: null
    },
    view: {
      type: String,
      default: 'cards',
      validator: value => value === null || ['list', 'cards'].includes(value)
    }
  },
  computed: {
    ...mapState(['data', 'apiCollections']),
    ...mapGetters(['getStac', 'root']),
    heading() {
      // Plain text passes through unchanged, locale keys get translated
      return this.$t(this.title || 'widgets.featured');
    },
    isLandingPage() {
      return this.data instanceof STAC
        && Boolean(this.root)
        && this.data.is(this.root);
    },
    resolvedEntities() {
      if (!this.isLandingPage) {
        return [];
      }
      return this.entities
        .map(entry => {
          if (typeof entry === 'string') {
            // Strings that contain a slash are URLs, everything else is treated as a collection ID
            return entry.includes('/') ? this.resolveUrl(entry) : this.resolveId(entry);
          }
          else if (isObject(entry)) {
            return this.resolveEntity(entry);
          }
          return null;
        })
        .filter(Boolean);
    }
  },
  watch: {
    // Register the entities that are given as objects in the database so that
    // they keep a stable identity and are available to the rest of the app.
    isLandingPage: {
      immediate: true,
      handler(shown) {
        if (shown) {
          this.registerEntities();
        }
      }
    }
  },
  methods: {
    // Constructs the URL for a collection ID from the collections endpoint of the API
    urlForId(id) {
      const link = this.data.getApiCollectionsLink();
      if (!link) {
        return null;
      }
      return `${Utils.removeTrailingSlash(link.href)}/${id}`;
    },
    // Determines the URL for an entity that is given as object:
    // from the self link, or derived from the ID for APIs.
    urlForEntity(entity) {
      let url = Utils.getLinkWithRel(entity.links, 'self')?.href;
      if (!url && hasText(entity.id)) {
        url = this.urlForId(entity.id);
      }
      return url ? toAbsolute(url, this.data.getAbsoluteUrl()) : null;
    },
    // Adds the (partially) complete STAC entities that are given as objects to
    // the database, flagged as incomplete so that the browser loads the full
    // entity when needed (e.g. when the user opens the entity).
    registerEntities() {
      for (const entry of this.entities) {
        if (!isObject(entry)) {
          continue;
        }
        const url = this.urlForEntity(entry);
        if (!url || this.getStac(url, true)) {
          continue;
        }
        try {
          // Serialize to a plain object: the props are reactive (which structuredClone
          // can't handle) and stac-js / migration must not alter the widget configuration
          const stac = createSTAC(JSON.parse(JSON.stringify(entry)), url, this.$store, true);
          this.$store.commit('loaded', { url, data: stac });
        } catch (error) {
          console.error(error);
        }
      }
    },
    // Collection IDs are resolved against the collections that are loaded
    // anyway, so they only work for APIs. IDs that are not loaded yet
    // (e.g. from a later page of a paginated API) are loaded like URLs.
    resolveId(id) {
      const collection = this.apiCollections.find(c => c.id === id);
      if (collection instanceof STAC) {
        return collection;
      }
      const url = this.urlForId(id);
      return url ? this.resolveUrl(url) : null;
    },
    // URLs work for both APIs and static catalogs.
    // If the entity is not loaded yet, a Link is returned so that the card
    // loads the entity through the background queue once it becomes visible.
    // Entities that failed to load are not shown.
    resolveUrl(url) {
      const absoluteUrl = toAbsolute(url, this.data.getAbsoluteUrl());
      const stac = this.getStac(absoluteUrl, true);
      if (stac instanceof Error) {
        return null;
      }
      return stac || new Link({ href: absoluteUrl, rel: 'child' }, this.data);
    },
    // Entities given as objects have been added to the database by registerEntities,
    // so they resolve from there (or to the full version, if loaded meanwhile).
    resolveEntity(entity) {
      const url = this.urlForEntity(entity);
      return url ? this.getStac(url) : null;
    }
  }
});
</script>
