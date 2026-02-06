import { mapState } from 'vuex';
import { STAC } from 'stac-js';
import Utils from '../utils';

export default {
  name: 'CardMixin',
  props: {
    showThumbnail: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapState(['cardViewMode', 'crossOriginMedia', 'defaultThumbnailSize']),
    isList() {
      return this.data && !this.data.isItem() && this.cardViewMode === 'list';
    },
    hasImage() {
      return this.showThumbnail && this.thumbnail;
    },
    thumbnail() {
      if (this.data) {
        let thumbnails = this.data.getThumbnails(true, 'thumbnail');
        if (thumbnails.length > 0) {
          let t = thumbnails[0];
          let width, height;
          const shape = t.getMetadata('proj:shape');
          if (Array.isArray(shape) && shape.length === 2) {
            [height, width] = shape;
          }
          else if (Array.isArray(this.defaultThumbnailSize) && this.defaultThumbnailSize.length === 2) {
            [height, width] = this.defaultThumbnailSize;
          }
          return {
            src: t.getAbsoluteUrl(),
            alt: t.title,
            crossorigin: this.crossOriginMedia,
            right: this.isList,
            blankColor: "rgba(0, 0, 0, 0.125)",
            width,
            height,
            // for b-card-img-lazy
            "blank-width": width,
            "blank-height": height
          };
        }
      }
      return null;
    },
    keywords() {
      if (this.data) {
        return this.data.getMetadata('keywords') || [];
      }
      return [];
    },
    isDeprecated() {
      if (!(this.data instanceof STAC)) {
        return false;
      }
      // Items have deprecated in properties, catalogs/collections have it at the root
      const deprecated = this.data.isItem() ? this.data.properties?.deprecated : this.data.deprecated;
      return Boolean(deprecated);
    },
    hasDescription() {
      if (!(this.data instanceof STAC)) {
        return false;
      }
      // Use getMetadata which handles both items and catalogs
      const description = this.data.getMetadata('description');
      return Utils.hasText(description);
    },
    summarizeDescription() {
      if (!this.hasDescription) {
        return '';
      }
      const description = this.data.getMetadata('description');
      return Utils.summarizeMd(description, 300);
    }
  }
};