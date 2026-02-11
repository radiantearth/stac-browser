<template>
  <main class="select-data-source">
    <b-form @submit.prevent="go">
      <b-form-group
        id="select" :label="$t('index.specifyCatalog')" label-for="url"
        :invalid-feedback="error" :state="valid"
        class="mb-3"
      >
        <b-form-input 
          id="url" 
          type="url" 
          :model-value="url" 
          @update:model-value="setUrl"
          placeholder="https://..."
        />
      </b-form-group>
      <b-button type="submit" variant="primary">{{ $t('index.load') }}</b-button>
    </b-form>
    <hr v-if="stacIndex.length > 0">
    <b-form-group v-if="stacIndex.length > 0" class="stac-index">
      <template #label>
        <i18n-t keypath="index.selectStacIndex" tag="span" scope="global">
          <template #stacIndex>
            <a href="https://stacindex.org" target="_blank">STAC Index</a>
          </template>
        </i18n-t>
      </template>
      <b-list-group> 
        <template v-for="catalog in stacIndex" :key="catalog.id">
          <b-list-group-item
            v-if="show(catalog)" button
            :active="url === catalog.url"
            @click="open(catalog.url)"
          >
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
import { mapGetters } from "vuex";
import { defineComponent } from 'vue';
import Description from '../components/Description.vue';
import Utils from '../utils';
import axios from "axios";

export default defineComponent({
  name: "SelectDataSource",
  components: {
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
      if (this.url.length === 0) {
        return null;
      }
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
      } catch (error) {
        return this.$t('index.urlInvalid', { error: error.message });
      }
    }
  },
  async created() {
    // Reset loaded STAC catalog
    this.$store.commit('resetCatalog', true);
    // Load entries from STAC Index
    try {
      let response = await axios.get('https://stacindex.org/api/catalogs');
      if(Array.isArray(response.data)) {
        this.stacIndex = response.data;
      }
    } catch (error) {
      console.error('Failed to load STAC Index:', error);
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
      if (this.url) {
        this.$router.push(this.toBrowserPath(this.url));  // Vue Router navigation
      }
    }
  }
});
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
