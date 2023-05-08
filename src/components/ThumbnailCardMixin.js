import { mapState } from 'vuex';

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
          if (Array.isArray(t['proj:shape']) && t['proj:shape'].length === 2) {
            [height, width] = t['proj:shape'];
          }
          else if (Array.isArray(this.defaultThumbnailSize) && this.defaultThumbnailSize.length === 2) {
            [height, width] = this.defaultThumbnailSize;
          }
          return {
            src: t.href,
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
    }
  }
};