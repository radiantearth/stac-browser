import { mapState } from 'vuex';
import Utils from '../utils';
import { STAC } from 'stac-js';

export default {
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
            width,
            height,
            placement: this.isList ? 'end' : 'top'
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
      return this.data instanceof STAC && Boolean(this.data.getMetadata('deprecated'));
    },
    hasDescription() {
      return this.data instanceof STAC && Utils.hasText(this.data.getMetadata('description'));
    },
    summarizeDescription() {
      return this.hasDescription ? Utils.summarizeMd(this.data.getMetadata('description'), 300) : '';
    }
  }
};
