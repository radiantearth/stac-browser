<template>
  <b-row>
    <b-col>
      <b-form @submit="onSubmit">
        <b-form-group id="select" label="Please specify a STAC Catalog or API..." label-for="url"
          :invalid-feedback="error" :state="valid">
          <b-form-input id="url" type="url" :value="url" @input="setUrl" placeholder="https://..."></b-form-input>
        </b-form-group>
        <hr />
        <b-form-group v-if="stacIndex.length > 0" id="stacIndex" label="... or select one from STAC Index">
          <b-list-group class="stacIndex">
            <template v-for="catalog in stacIndex">
              <b-list-group-item button v-if="show(catalog)" :key="catalog.id" class="flex-column align-items-start"
                :active="url === catalog.url" @click="setUrl(catalog.url, false)">
                <div class="d-flex w-100 justify-content-between">
                  <strong class="mb-1">{{ catalog.title }}</strong>
                  <small>
                    <b-badge v-if="catalog.isApi" variant="dark" pill>API</b-badge>
                    <b-badge v-else variant="light" pill>Catalog</b-badge>
                  </small>
                </div>
                <p class="mb-1"><Description :description="catalog.summary" :compact="true" /></p>
              </b-list-group-item>
            </template>
          </b-list-group>
        </b-form-group>
        <b-button type="submit" variant="primary">Load</b-button>
      </b-form>
    </b-col>
  </b-row>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BListGroup, BListGroupItem } from 'bootstrap-vue';
import { mapGetters, mapState } from "vuex";
import Description from '../components/Description.vue';

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
      filter: false
    };
  },
  computed: {
    ...mapState(['stacIndex']),
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
          return 'The URL is missing a protocol.';
        }
        else if (!url.host) {
          return 'The URL is missing a host.';
        }
        return null;
      } catch (error) {
        return 'The URL is invalid.';
      }
    }
  },
  created() {
    this.$store.dispatch('loadStacIndex');
    this.$store.commit('resetPage'); // Reset loaded STAC entity
  },
  methods: {
    show(catalog) {
      if (catalog.access === 'private') {
        return false;
      }
      else if(!this.url || !this.filter) {
        return true;
      }

      let searchTerm = this.url.toLowerCase();
      if (typeof catalog.title === 'string' && catalog.title.toLowerCase().includes(searchTerm)) {
        return true;
      }
      if (typeof catalog.url === 'string' && catalog.url.toLowerCase().includes(searchTerm)) {
        return true;
      }
      return false;
    },
    setUrl(url, filter = true) {
      this.url = url;
      this.filter = filter;
    },
    onSubmit() {
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