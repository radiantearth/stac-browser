import { mapState } from "vuex";
import STAC from "../models/stac";

export default global => ({

  data() {
    return {
      apiItems: [],
      apiItemsLink: null,
      apiItemsLoadingState: true,
      apiItemsPagination: {},
    };
  },
  computed: {
    itemPages() {
      let pages = Object.assign({}, this.apiItemsPagination);
      // If first link is not available, add the items link as first link
      if (!pages.first && this.data && this.apiItemsLink && this.apiItemsLink.rel !== 'items') {
        pages.first = Utils.addFiltersToLink(this.apiItemsLink, this.filters);
      }
      return pages;
    }
  },
  methods: {
    resetApiItems() {
      this.apiItems = [];
      this.apiItemsLoading = true;
      this.apiItemsPagination = {};
    },
    async loadApiItems(cx, { link, stac, show, filters }) {
      this.apiItemsLoading = true;

      try {
        let baseUrl = cx.state.url;
        if (stac instanceof STAC) {
          link = stac.getApiItemsLink();
          baseUrl = stac.getAbsoluteUrl();
        }

        if (!Utils.isObject(filters)) {
          filters = {};
        }
        if (typeof filters.limit !== 'number') {
          filters.limit = cx.state.itemsPerPage;
        }

        link = Utils.addFiltersToLink(link, filters);

        let response = await stacRequest(cx, link);
        if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
          throw new BrowserError('The API response is not a valid list of STAC Items');
        }
        else {
          response.data.features = response.data.features.map(item => {
            try {
              if (!Utils.isObject(item)) {
                return null;
              }
              let selfLink = Utils.getLinkWithRel(item.links, 'self');
              let url;
              if (selfLink?.href) {
                url = Utils.toAbsolute(selfLink.href, baseUrl);
              }
              else if (typeof item.id !== 'undefined') {
                let apiCollectionsLink = cx.getters.root?.getApiCollectionsLink();
                if (baseUrl) {
                  url = Utils.toAbsolute(`items/${item.id}`, baseUrl);
                }
                else if (apiCollectionsLink) {
                  url = Utils.toAbsolute(`${stac.id}/items/${item.id}`, apiCollectionsLink.href);
                }
                else if (cx.state.catalogUrl) {
                  url = Utils.toAbsolute(`collections/${stac.id}/items/${item.id}`, cx.state.catalogUrl);
                }
                else {
                  return null;
                }
              }
              else {
                return null;
              }
              return new STAC(item, url, cx.getters.toBrowserPath(url));
            } catch (error) {
              console.error(error);
              return null;
            }
          }).filter(item => item instanceof STAC);

          if (show) {
            this.apiItemsLink = link;
          }

          cx.commit('setApiItems', { data: response.data, stac, show });
          this.apiItemsLoading = false;
          return response;
        }
      } catch (error) {
        this.apiItemsLoading = false;
        throw error;
      }
    },
    setApiItems(state, { data, stac, show }) {
      if (!Utils.isObject(data) || !Array.isArray(data.features)) {
        return;
      }
      let apiItems = data.features.map(feature => processSTAC(state, feature));
  
      if (show) {
        state.apiItems = apiItems;
      }
  
      // Handle pagination links
      let pageLinks = Utils.getLinksWithRels(data.links, stacPagination);
      let pages = {};
      for (let pageLink of pageLinks) {
        let rel = pageLink.rel === 'previous' ? 'prev' : pageLink.rel;
        pages[rel] = pageLink;
      }
  
      if (show) {
        state.apiItemsPagination = pages;
      }
  
      if (stac instanceof STAC) {
        // ToDo: Prev link only required when state.apiItems is not cached(?) -> cache apiItems?
        stac.setApiData(apiItems, pages.next, pages.prev);
      }
    },
    async paginateItems(link) {
      try {
        await this.loadApiItems({link, show: true, filters: this.filters});
      } catch (error) {
        this.$root.$emit('error', error, SORRY_ITEM_LIST);
      }
    },
    async paginateItems(link) {
      this.apiItemsLoading = true;
      try {
        let response = await this.$store.dispatch('loadApiItems', {link, show: true, filters: this.filters});
        this.handleResponse(response);
      } catch (error) {
        this.$root.$emit('error', error, 'Sorry, loading the list of STAC Items failed.');
      } finally {
        this.apiItemsLoading = false;
      }
    },

    async filterItems(filters, reset) {
      this.filters = filters;
      if (reset) {
        this.resetApiItems();
      }
      try {
        await this.$store.dispatch('loadApiItems', {link: this.apiItemsLink, show: true, filters});
      } catch (error) {
        this.$root.$emit('error', error, reset ? SORRY_ITEM_LIST : "Sorry, can't load the filtered list of items.");
      }
    },
    async filterItems(filters) {
      this.apiItemsLoading = true;
      try {
        let response = await this.$store.dispatch('loadApiItems', {link: this.searchLink, show: true, filters});
        this.handleResponse(response);
      } catch(error) {
        this.$root.$emit('error', error, 'Sorry, loading a filtered list of STAC Items failed.');
      } finally {
        this.apiItemsLoading = false;
      }
    },
  }
});