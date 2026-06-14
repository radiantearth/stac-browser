import { defineComponent } from 'vue';
import Utils from '../utils';
import { mapGetters, mapState } from 'vuex';
import { stacBrowserSpecialHandling } from "../rels";

const COG_MIME_TYPES = [
  'image/tiff',
  'image/tiff; application=geotiff',
  'image/tiff; application=geotiff; profile=cloud-optimized',
  'image/vnd.stac.geotiff',
  'application/x-geotiff',
];

export default defineComponent({
  data() {
    return {
      tabIds: {
        map: 'map',
        thumbnails: 'thumbnails'
      },
      tab: null,
      shownOnMap: [],
      selectedAssets: [],
      hasAutoSelected: false
    };
  },
  watch: {
    assets: {
      immediate: true,
      handler(assets) {
        if (this.hasAutoSelected || !assets || assets.length === 0) {return;}
        this._autoSelectCogAsset(assets);
      }
    }
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
        assets = assets.filter(asset => !this.thumbnails.includes(asset));
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
    showAsset(asset) {
      // Compare by absolute URL: thumbnails/assets are stac-js Asset/Link
      // instances (no `is()` method — that only exists on STAC entities), so
      // `t.is(asset)` throws. See https://github.com/moregeo-it/stac-js/issues/12
      if (this.thumbnails.find(t => t.getAbsoluteUrl() === asset.getAbsoluteUrl())) {
        this.tab = this.tabIds.thumbnails;
      }
      else {
        this.tab = this.tabIds.map;
        this.selectedAssets = [asset];
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
        this.tab = this.tabIds.thumbnails;
      }
    },
    _autoSelectCogAsset(assets) {
      const cogAssets = assets.filter(asset => {
        const type = asset.type || '';
        return COG_MIME_TYPES.some(mt => type.includes(mt));
      });
      if (cogAssets.length === 0) {return;}

      const visual = cogAssets.find(a =>
        Array.isArray(a.roles) && a.roles.includes('visual')
      );
      this.selectedAssets = [visual || cogAssets[0]];
      this.hasAutoSelected = true;
    }
  }
});
