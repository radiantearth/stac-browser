<template>
  <img
    v-if="displaySrc" :src="displaySrc" :alt="alt" :title="title"
    :crossorigin="crossorigin" :class="placement ? `card-img-${placement}` : null"
    :loading="lazy ? 'lazy' : null" :width="width" :height="height"
    @load="$emit('load', $event)" @error="$emit('error', $event)"
  >
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { acquire, needsAuthenticatedFetch, release } from '../models/authMedia';

/**
 * An image that is loaded with the configured credentials.
 *
 * Query-parameter credentials are added to the image URL. Header-based
 * credentials can't be sent by `<img>` elements, so the image is loaded
 * through an authenticated request and shown via an object URL instead.
 * Both only apply to URLs that are part of the catalog, external images
 * never receive credentials.
 *
 * Failed authenticated requests fall back to loading the image directly
 * (without the headers) and never open the login dialog; errors are
 * reported through the `error` event.
 */
export default {
  name: 'AuthImage',
  props: {
    // The (absolute) URL of the image, without any credentials
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    },
    crossorigin: {
      type: String,
      default: null
    },
    // Same as the `placement` prop of b-card-img
    placement: {
      type: String,
      default: null
    },
    lazy: {
      type: Boolean,
      default: false
    },
    width: {
      type: [Number, String],
      default: null
    },
    height: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['load', 'error', 'resolved'],
  data() {
    return {
      blobUrl: null,
      // The URL currently held in the authMedia cache
      acquiredUrl: null,
      failed: false
    };
  },
  computed: {
    ...mapState(['requestHeaders']),
    ...mapGetters(['getRequestUrl']),
    // The image URL incl. any query-parameter credentials
    requestUrl() {
      return this.getRequestUrl(this.src);
    },
    useAuthenticatedFetch() {
      return !this.failed && needsAuthenticatedFetch(this.$store, this.src);
    },
    displaySrc() {
      if (this.useAuthenticatedFetch) {
        return this.blobUrl; // null (= not rendered) while loading
      }
      return this.requestUrl;
    }
  },
  watch: {
    // Lets parents use the URL the image is shown from, e.g. for download links
    displaySrc: {
      immediate: true,
      handler(url) {
        this.$emit('resolved', url);
      }
    },
    src() {
      this.failed = false;
      this.resolve();
    },
    requestHeaders: {
      deep: true,
      handler() {
        // Re-resolve after login/logout
        this.failed = false;
        this.resolve();
      }
    }
  },
  created() {
    this.resolve();
  },
  beforeUnmount() {
    this.releaseAcquired();
  },
  methods: {
    async resolve() {
      if (!this.useAuthenticatedFetch) {
        this.releaseAcquired();
        this.blobUrl = null;
        return;
      }
      const url = this.src;
      try {
        const blobUrl = await acquire(this.$store, url);
        if (url !== this.src) {
          // The src changed while loading
          release(this.$store, url);
          return;
        }
        this.releaseAcquired();
        this.acquiredUrl = url;
        this.blobUrl = blobUrl;
      } catch (error) {
        if (url !== this.src) {
          return;
        }
        // Fall back to loading the image directly, which either works
        // (e.g. a public image in a partially protected catalog) or
        // reports the failure through the error event of the element.
        this.failed = true;
        this.blobUrl = null;
        this.$emit('error', error);
      }
    },
    releaseAcquired() {
      if (this.acquiredUrl) {
        release(this.$store, this.acquiredUrl);
        this.acquiredUrl = null;
      }
    }
  }
};
</script>
