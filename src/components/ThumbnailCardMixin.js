import { mapState } from 'vuex';

export default {
  props: {
    showThumbnail: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // Lazy load thumbnails and not all at once.
      // false = don't load yet, true = try to load it, null = image errored
      // Todo: Use b-card-img-lazy instead?
      thumbnailShown: false
    };
  },
  computed: {
    ...mapState(['cardViewMode', 'crossOriginMedia']),
    isList() {
      return this.data && !this.data.isItem() && this.cardViewMode === 'list';
    },
    hasImage() {
      return this.showThumbnail && this.thumbnail && this.thumbnailShown;
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
          return {
            src: t.href,
            alt: t.title,
            crossorigin: this.crossOriginMedia,
            right: this.isList,
            width,
            height
          };
        }
      }
      return null;
    }
  },
  methods: {
    hideBrokenImg(event) {
      console.log(`Hiding item thumbnail for ${event.srcElement.src} as it can't be loaded.`);
      this.thumbnailShown = null;
    },
    loadImg(visible) {
      if (visible && this.thumbnailShown !== null) {
        this.thumbnailShown = true;
      }
    }
  }
};