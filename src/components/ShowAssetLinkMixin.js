import { toRaw } from 'vue';
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
        move: (ref, offset) => this.moveAsset(ref, offset),
        isShown: ref => this.isShown(ref),
        isOnMap: ref => this.isOnMap(ref),
        isSelected: ref => this.isSelected(ref),
        canManage: ref => this.canManage(ref),
        getRevealed: () => this.revealedDataSource
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
      selectedDataSources: null,
      revealedDataSource: null
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
    isReferenceEqual(a, b) {
      // Web map links can share the URL, but differ in other properties (e.g. the WMS layers)
      if (a?.isLink || b?.isLink) {
        // The STAC data may be wrapped in a reactive proxy
        return toRaw(a) === toRaw(b);
      }
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
        return this.isReferenceEqual(a.getContext(), b);
      }
      if (b.isAlternate) {
        return this.isReferenceEqual(a, b.getContext());
      }
      return false;
    },
    isShown(ref) {
      return this.selectedReferences.some(shown => this.isReferenceEqual(shown, ref));
    },
    isOnMap(ref) {
      return this.shownOnMap.some(shown => this.isReferenceEqual(shown, ref));
    },
    isSelected(ref) {
      return Boolean(this.selectedDataSources?.some(selected => this.isReferenceEqual(selected, ref)));
    },
    canManage(ref) {
      // Only the assets and links of this STAC entity, not of its children
      let context = ref?.getContext?.();
      while (context?.isAsset) {
        context = context.getContext();
      }
      return Boolean(context) && toRaw(context) === toRaw(this.data);
    },
    getSelection() {
      return (this.selectedDataSources || this.shownOnMap).slice();
    },
    isThumbnail(asset) {
      return this.thumbnails.some(t => this.isReferenceEqual(t, asset));
    },
    showAsset(asset) {
      if (this.isThumbnail(asset)) {
        this.tab = this.tabIds.thumbnails;
      }
      else {
        this.tab = this.tabIds.map;
        const selection = this.getSelection().filter(ref => !this.isReferenceEqual(ref, asset));
        if (selection.length >= MAX_SHOWN_ON_MAP) {
          this.$store.commit('showGlobalError', {
            message: this.$t('mapping.maxLayers', {max: MAX_SHOWN_ON_MAP})
          });
          return;
        }
        // The last data source is rendered on top, ol-stac identifies them by the (raw) objects
        selection.push(toRaw(asset));
        this.selectedDataSources = selection;
        // Also shows the layer if it was hidden through the layer switcher
        this.revealedDataSource = { ref: asset };
      }
      if (this.$refs.tabs) {
        Utils.scrollTo(this.$refs.tabs.$el);
      }
    },
    hideAsset(asset) {
      this.selectedDataSources = this.getSelection().filter(ref => !this.isReferenceEqual(ref, asset));
    },
    moveAsset(asset, offset) {
      const selection = this.getSelection();
      const from = selection.findIndex(ref => this.isReferenceEqual(ref, asset));
      const to = from + offset;
      if (from < 0 || to < 0 || to >= selection.length) {
        return;
      }
      selection.splice(to, 0, selection.splice(from, 1)[0]);
      this.selectedDataSources = selection;
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
