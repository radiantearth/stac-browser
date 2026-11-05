import Utils from '../utils';
import { mapGetters, mapState } from 'vuex';
import { stacBrowserSpecialHandling } from "../rels";

// Each layer needs a WebGL context, of which browsers only allow a few
export const MAX_SHOWN_ON_MAP = 8;

export default {
  provide() {
    return {
      mapSelection: {
        show: ref => this.showAsset(ref),
        hide: ref => this.hideAsset(ref),
        isShown: ref => this.isShown(ref),
        isOnMap: ref => this.isOnMap(ref)
      }
    };
  },
  data() {
    return {
      tabIds: {
        map: 'map',
        thumbnails: 'thumbnails'
      },
      tab: null,
      shownOnMap: [],
      selectedDataSources: null
    };
  },
  computed: {
    ...mapState(['showThumbnailsAsAssets']),
    ...mapGetters(['data']),
    hasAssets() {
      return this.assets.length > 0;
    },
    assets() {
      if (!this.data) {
        return [];
      }
      let assets = this.data.getAssets();
      if (!this.showThumbnailsAsAssets) {
        assets = assets.filter(asset => !this.isThumbnail(asset));
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
      return this.data.getThumbnails(true, null, true);
    },
    additionalLinks() {
      if (!this.data) {
        return [];
      }
      return this.data.getLinksWithOtherRels(stacBrowserSpecialHandling)
        .filter(link => link.rel !== 'preview' || !link.canBrowserDisplayImage());
    },
    selectedReferences() {
      if (this.tab === this.tabIds.map) {
        return this.shownOnMap;
      }
      else {
        return this.thumbnails;
      }
    }
  },
  methods: {
    isAssetEqual(a, b) {
      if (!a?.isAsset || !b?.isAsset) {
        return false;
      }
      if (a === b) {
        return true;
      }
      if (a.getAbsoluteUrl() === b.getAbsoluteUrl()) {
        return true;
      }
      if (a.isAlternate) {
        return this.isAssetEqual(a.getContext(), b);
      }
      if (b.isAlternate) {
        return this.isAssetEqual(a, b.getContext());
      }
      return false;
    },
    isShown(ref) {
      return this.selectedReferences.some(shown => this.isAssetEqual(shown, ref));
    },
    isOnMap(ref) {
      return this.shownOnMap.some(shown => this.isAssetEqual(shown, ref));
    },
    getSelection() {
      return (this.selectedDataSources || this.shownOnMap).slice();
    },
    isThumbnail(asset) {
      return this.thumbnails.some(t => this.isAssetEqual(t, asset));
    },
    showAsset(asset) {
      if (this.isThumbnail(asset)) {
        this.tab = this.tabIds.thumbnails;
      }
      else {
        this.tab = this.tabIds.map;
        const selection = this.getSelection().filter(ref => !this.isAssetEqual(ref, asset));
        if (selection.length >= MAX_SHOWN_ON_MAP) {
          this.$store.commit('showGlobalError', {
            message: this.$t('mapping.maxLayers', {max: MAX_SHOWN_ON_MAP})
          });
          return;
        }
        // The last data source is rendered on top
        selection.push(asset);
        this.selectedDataSources = selection;
      }
      if (this.$refs.tabs) {
        Utils.scrollTo(this.$refs.tabs.$el);
      }
    },
    hideAsset(asset) {
      this.selectedDataSources = this.getSelection().filter(ref => !this.isAssetEqual(ref, asset));
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
        this.tab = this.tabIds.thumbnails;
      }
    }
  }
};
