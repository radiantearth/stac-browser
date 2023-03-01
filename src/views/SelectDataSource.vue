<template>
  <main class="select-data-source">
    <b-form @submit="go">
      <b-form-group
        id="select" :label="$t('index.specifyCatalog')" label-for="url"
        :invalid-feedback="error" :state="valid"
      >
        <b-form-input id="url" type="url" :value="url" @input="setUrl" placeholder="https://..." />
      </b-form-group>
      <b-button type="submit" variant="primary">{{ $t('index.load') }}</b-button>
    </b-form>
    <hr v-if="stacIndex.length > 0">
    <b-form-group v-if="stacIndex.length > 0" class="stac-index">
      <template #label>
        <i18n path="index.selectStacIndex">
          <template #stacIndex>
            <a href="https://stacindex.org" target="_blank">STAC Index</a>
          </template>
        </i18n>
      </template>
      <b-list-group>
        <template v-for="catalog in stacIndex">
          <b-list-group-item button v-if="show(catalog)" :key="catalog.id" :active="url === catalog.url" @click="open(catalog.url)">
            <div class="d-flex justify-content-between align-items-baseline mb-1">
              <strong>{{ catalog.title }}</strong>
              <b-badge v-if="catalog.isApi" variant="danger">{{ $t('index.api') }}</b-badge>
              <b-badge v-else variant="success">{{ $t('index.catalog') }}</b-badge>
            </div>
            <Description :description="catalog.summary" compact />
          </b-list-group-item>
        </template>
      </b-list-group>
    </b-form-group>
  </main>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BListGroup, BListGroupItem } from 'bootstrap-vue';
import { mapGetters } from "vuex";
import Description from '../components/Description.vue';
import Utils from '../utils';
// import axios from "axios";

export default {
  name: "SelectDataSource",
  components: {
    BForm,
    BFormGroup,
    BFormInput,
    BListGroup,
    BListGroupItem,
    Description
  },
  data() {
    return {
      url: '',
      stacIndex: []
    };
  },
  computed: {
    ...mapGetters(['toBrowserPath']),
    valid() {
      return !this.error;
    },
    error() {
      if (!this.url) {
        return null;
      }
      try {
        let url = new URL(this.url);
        if (!url.protocol) {
          return this.$t('index.urlMissingProtocol');
        }
        else if (!url.host) {
          return this.$t('index.urlMissingHost');
        }
        return null;
      } catch (errot) {
        return this.$t('index.urlInvalid');
      }
    }
  },
  async created() {
    // Reset loaded STAC catalog
    this.$store.commit('resetCatalog', true);
    // Load entries from STAC Index
    try {
      // let response = await axios.get('https://stacindex.org/api/catalogs');
      // HARDCODED PG&E CATALOGS ------------------------------------------------------------------------------------------------------------------------- HARDCODED PG&E CATALOGS
      let response = [
            {"id":1,"url":"https://pgestacapi.atomicmaps.net/","slug":"als-ktn","title":"PG&E Substation Inspection Imagery","summary":"Substation inspection imagery catalog","access":"public","created":"2023-02-28T16:18:40.008Z","updated":"2021-03-01T16:18:40.008Z","isPrivate":false,"isApi":true,"accessInfo":null},
            {"id":2,"url":"https://atomicmapsdemo.s3.us-west-2.amazonaws.com/christie-sub-inspection-STAC/catalog.json","slug":"als-ktn","title":"Christie Substation Catalog","summary":"Substation imagery catalog","access":"public","created":"2021-08-31T16:18:40.008Z","updated":"2021-08-31T16:18:40.008Z","isPrivate":false,"isApi":false,"accessInfo":null},
            {"id":3,"url":"https://atomicmapsdemo.s3.us-west-2.amazonaws.com/ElectricOperations-STAC/catalog.json","slug":"als-ktn","title":"Electric Operations Catalog","summary":"Electric Operations transmission imagery","access":"public","created":"2021-08-31T16:18:40.008Z","updated":"2021-08-31T16:18:40.008Z","isPrivate":false,"isApi":false,"accessInfo":null},
            {"id":4,"url":"https://atomicmapsdemo.s3.us-west-2.amazonaws.com/PGE-points-STAC/catalog.json","slug":"als-ktn","title":"Point Cloud Catalog","summary":"Thinned transmission LiDAR point clouds","access":"public","created":"2021-08-31T16:18:40.008Z","updated":"2021-08-31T16:18:40.008Z","isPrivate":false,"isApi":false,"accessInfo":null},
            {"id":5,"url":"https://atomicmapsdemo.s3.us-west-2.amazonaws.com/ElectricOperationsLiDAR-STAC/catalog.json","slug":"als-ktn","title":"Electric Operations Catalog with Point Clouds","summary":"Electric Operations transmission imagery with thinned LiDAR","access":"public","created":"2021-08-31T16:18:40.008Z","updated":"2021-08-31T16:18:40.008Z","isPrivate":false,"isApi":false,"accessInfo":null}
          ];
      if(Array.isArray(response)) {
        this.stacIndex = response;
      }
      // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
      // if(Array.isArray(response.data)) {
      //   this.stacIndex = response.data;
      // }
    } catch (error) {
      console.error(error);
    }
  },
  methods: {
    show(catalog) {
      if (catalog.access === 'private') {
        return false;
      }
      else if(!this.url) {
        return true;
      }

      return Utils.search(this.url, [catalog.title, catalog.url]);
    },
    setUrl(url) {
      this.url = url;
    },
    open(url) {
      this.url = url;
      this.go();
    },
    go() {
      this.$router.push(this.toBrowserPath(this.url));
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser .select-data-source {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  hr {
    width: 100%;
  }

  .stac-index {
    margin: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    > div {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
      border: 1px solid rgba(0,0,0,.125);
      border-radius: $border-radius;

      .list-group {
        width: 100%;

        .list-group-item {
          border: 0;
          border-bottom: 1px solid rgba(0,0,0,.125);
        }

        .active .styled-description a {
          color: white;
        }
      }
    }
  }
}
</style>