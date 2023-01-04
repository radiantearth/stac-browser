<template>
  <b-row>
    <b-col>
      <b-form @submit="go">
        <b-form-group
          id="select" :label="$t('index.specifyCatalog')" label-for="url"
          :invalid-feedback="error" :state="valid"
        >
          <b-form-input id="url" type="url" :value="url" @input="setUrl" placeholder="https://..." />
        </b-form-group>
        <b-button type="submit" variant="primary">{{ $t('index.load') }}</b-button>
      </b-form>
      <hr>
      <b-form-group v-if="stacIndex.length > 0" id="stacIndex" :label="$t('index.selectStacIndex')">
        <b-list-group class="stacIndex">
          <template v-for="catalog in stacIndex">
            <b-list-group-item
              button v-if="show(catalog)" :key="catalog.id" class="flex-column align-items-start"
              :active="url === catalog.url" @click="open(catalog.url)"
            >
              <div class="d-flex w-100 justify-content-between">
                <strong class="mb-1">{{ catalog.title }}</strong>
                <small>
                  <b-badge v-if="catalog.isApi" variant="dark" pill>{{ $t('index.api') }}</b-badge>
                  <b-badge v-else variant="light" pill>{{ $t('index.catalog') }}</b-badge>
                </small>
              </div>
              <div class="mb-1">
                <Description :description="catalog.summary" compact />
              </div>
            </b-list-group-item>
          </template>
        </b-list-group>
      </b-form-group>
    </b-col>
  </b-row>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BListGroup, BListGroupItem } from 'bootstrap-vue';
import { mapGetters } from "vuex";
import Description from '../components/Description.vue';
import Utils from '../utils';
import axios from "axios";

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
      } catch (error) {
        return this.$t('index.urlInvalid');
      }
    }
  },
  async created() {
    // Load entries from STAC Index
    try {
      let response = await axios.get('https://stacindex.org/api/catalogs');
      if(Array.isArray(response.data)) {
        this.stacIndex = response.data;
      }
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
      this.$store.commit('resetCatalog'); // Reset loaded STAC catalog
      this.$router.push(this.toBrowserPath(this.url));
    }
  }
};
</script>

<style lang="scss">
#stac-browser {
  .stacIndex {
    max-height: 50vh;
    overflow: auto;

    .active .styled-description a {
      color: white;
    }
  }
}
</style>