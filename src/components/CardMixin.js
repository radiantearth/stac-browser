import { mapState } from 'vuex';
import Utils from '../utils';
import { hasText } from 'stac-js/src/utils.js';
import { STAC } from 'stac-js';

export default {
  props: {
    showThumbnail: {
      type: Boolean,
      default: true
    },
    // The view mode of the containing list ('list' or 'cards').
    // If not given, falls back to the global card view mode chosen by the user.
    viewMode: {
      type: String,
      default: null,
      validator: value => value === null || ['list', 'cards'].includes(value)
    }
  },
  data() {
    return {
      // The index of the thumbnail to show, increased if a thumbnail fails to load
      thumbnailIndex: 0
    };
  },
  computed: {
    ...mapState(['cardViewMode', 'crossOriginMedia', 'defaultThumbnailSize']),
    isList() {
      return this.data && (this.viewMode || this.cardViewMode) === 'list';
    },
    hasImage() {
      return this.showThumbnail && this.thumbnail;
    },
    thumbnail() {
      if (this.data) {
        let thumbnails = this.data.getThumbnails(true, 'thumbnail', true);
        if (thumbnails.length > this.thumbnailIndex) {
          let t = thumbnails[this.thumbnailIndex];
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
      return this.data instanceof STAC && hasText(this.data.getMetadata('description'));
    },
    summarizeDescription() {
      return this.hasDescription ? Utils.summarizeMd(this.data.getMetadata('description'), 300) : '';
    }
  },
  watch: {
    data() {
      this.thumbnailIndex = 0;
    }
  },
  methods: {
    // Falls back to the next thumbnail, hides the image if there's none
    nextThumbnail() {
      this.thumbnailIndex++;
    }
  }
};
