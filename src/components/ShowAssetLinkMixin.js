import Utils from '../utils';
import { mapGetters, mapState } from 'vuex';
import { stacBrowserSpecialHandling } from "../rels";

export default {
  data() {
    return {
      tab: null,
      shownOnMap: [],
    };
  },
  computed: {
    ...mapState(['showThumbnailsAsAssets']),
    ...mapGetters(['data']),
    // hasAssets in stac-js also checks whether the assets have a href and thus are not item asset definitions
    hasAssets() {
      return this.assets.length > 0;
    },
    assets() {
      if (!this.data) {
        return [];
      }
      let assets = this.data.getAssets();
      if (!this.showThumbnailsAsAssets) {
        assets = assets.filter(asset => !asset.isPreview());
      }
      return assets;
    },
    hasThumbnails() {
      return this.thumbnails.length > 0;
    },
    thumbnails() {
      if (!this.data) {
        return [];
      }
      return this.data.getThumbnails();
    },
    additionalLinks() {
      if (!this.data) {
        return [];
      }
      return this.data.getLinksWithOtherRels(stacBrowserSpecialHandling)
        .filter(link => link.rel !== 'preview' || !Utils.canBrowserDisplayImage(link));
    },
    selectedAssets() {
      if (this.tab === 0) {
        return this.shownOnMap;
      }
      else {
        return this.thumbnails;
      }
    }
  },
  methods: {
    showAsset(asset) {
      if (asset.isPreview()) {
        this.tab = 1;
      }
      else {
        this.tab = 0;
        this.shownOnMap = [asset];
      }
      if (this.$refs.tabs) {
        Utils.scrollTo(this.$refs.tabs.$el);
      }
    },
    dataChanged(data) {
      if (Array.isArray(data)) {
        this.shownOnMap = data;
      }
      else {
        this.shownOnMap = [];
      }
    },
    handleEmptyMap() {
      if (this.hasThumbnails) {
        this.tab = 1;
      }
    }
  }
};
