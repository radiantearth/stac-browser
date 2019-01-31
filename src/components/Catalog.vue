<template>
  <div>
    <b-container :class="loaded && 'loaded'">
      <b-row>
        <b-col md="12">
          <header>
            <b-breadcrumb :items="breadcrumbs" />
          </header>
        </b-col>
      </b-row>
      <b-row>
        <b-col :md="keywords.length > 0 || license != null ? 8 : 12">
          <!-- <a href="https://www.planet.com/disasterdata/">
            <img
              id="header_logo"
              src="https://planet-pulse-assets-production.s3.amazonaws.com/uploads/2016/06/blog-logo.jpg"
              alt="Powered by Planet Labs"
              class="float-right">
          </a>-->
          <h1 class="scroll">{{ title }}</h1>
          <p v-if="version">
            <small>Version {{ version }}</small>
          </p>
          <p class="scroll">
            <small>
              <b-button
                v-clipboard="url"
                variant="link"
                size="sm"
                class="clipboard"
              >
                <span
                  v-if="validationErrors"
                  title="Validation errors present; please check the JavaScript Console"
                  >⚠️</span
                >
                <i class="far fa-copy" />&nbsp;
                <code>{{ url }}</code>
              </b-button>
            </small>
          </p>
          <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
          <div v-if="description" v-html="description" />

          <b-tabs v-model="tabIndex">
            <b-tab
              v-if="visibleTabs.includes('catalogs')"
              key="catalogs"
              title="Catalogs"
            >
              <b-table
                :items="children"
                :fields="childFields"
                :per-page="childrenPerPage"
                :current-page="currentChildPage"
                :outlined="true"
                responsive
                small
                striped
              >
                <template slot="link" slot-scope="data">
                  <router-link :to="data.item.slug" append>{{
                    data.item.title
                  }}</router-link>
                </template>
              </b-table>
              <b-pagination
                v-if="childCount > childrenPerPage"
                v-model="currentChildPage"
                :limit="15"
                :total-rows="childCount"
                :per-page="childrenPerPage"
                :hide-goto-end-buttons="true"
              />
            </b-tab>

            <b-tab
              v-if="visibleTabs.includes('items')"
              key="items"
              title="Items"
            >
              <b-table
                :items="items"
                :fields="itemFields"
                :per-page="itemsPerPage"
                :current-page="currentItemPage"
                :sort-compare="sortCompare"
                :outlined="true"
                responsive
                small
                striped
              >
                <template slot="link" slot-scope="data">
                  <router-link :to="data.item.to">{{
                    data.item.title
                  }}</router-link>
                </template>
                <!-- TODO row-details w/ additional metadata + map -->
              </b-table>
              <b-pagination
                v-if="itemCount > items.length"
                v-model="currentItemPage"
                :limit="15"
                :total-rows="itemCount"
                :per-page="itemsPerPage"
                :hide-goto-end-buttons="true"
              />
            </b-tab>
            <b-tab
              v-if="visibleTabs.includes('bands')"
              key="bands"
              title="Bands"
            >
              <b-table
                :items="bands"
                :fields="bandFields"
                responsive
                small
                striped
              />
            </b-tab>
          </b-tabs>
        </b-col>
        <b-col v-if="keywords.length > 0 || license != null" md="4">
          <b-card bg-variant="light">
            <div v-if="spatialExtent" id="locator-map" />
            <div class="table-responsive">
              <table class="table">
                <tbody>
                  <template v-if="providers">
                    <tr>
                      <th colspan="2">
                        <h3>
                          <template v-if="providers.length === 1"
                            >Provider</template
                          >
                          <template v-if="providers.length !== 1"
                            >Providers</template
                          >
                        </h3>
                      </th>
                    </tr>
                    <template v-for="(provider, index) in providers">
                      <tr :key="provider.url + index">
                        <td colspan="2" class="provider">
                          <a :href="provider.url">{{ provider.name }}</a>
                          <em v-if="provider.roles"
                            >({{ provider.roles.join(", ") }})</em
                          >
                          <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
                          <div
                            v-if="provider.description"
                            class="description"
                            v-html="provider.description"
                          />
                        </td>
                      </tr>
                    </template>
                  </template>
                  <tr>
                    <td class="title">STAC Version</td>
                    <td>{{ stacVersion }}</td>
                  </tr>
                  <tr v-if="keywords">
                    <td class="title">Keywords</td>
                    <td>{{ keywords }}</td>
                  </tr>
                  <tr v-if="license">
                    <td class="title">License</td>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <td v-html="license" />
                  </tr>
                  <tr v-if="temporalExtent">
                    <td class="title">Temporal Extent</td>
                    <td>{{ temporalExtent }}</td>
                  </tr>
                  <tr v-for="prop in propertyList" :key="prop.key">
                    <td class="title">
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span :title="prop.key" v-html="prop.label" />
                    </td>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <td v-html="prop.value" />
                  </tr>
                </tbody>
              </table>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <footer class="footer">
      <b-container>
        <span class="poweredby text-muted">
          Powered by
          <a href="https://github.com/radiantearth/stac-browser"
            >STAC Browser</a
          >
        </span>
      </b-container>
    </footer>
  </div>
</template>

<script>
import Leaflet from "leaflet";
import { mapActions, mapGetters } from "vuex";

import common from "./common";

const ITEMS_PER_PAGE = 25;

export default {
  ...common,
  name: "Catalog",
  props: {
    ancestors: {
      type: Array,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    resolve: {
      type: Function,
      required: true
    },
    slugify: {
      type: Function,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    validate: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      externalItemCount: 0,
      externalItemsPerPage: 0,
      childFields: {
        link: {
          label: "Title",
          sortable: true
        }
      },
      currentChildPage: 1,
      childrenPerPage: 25,
      itemFields: {
        link: {
          label: "Title",
          sortable: true
        },
        dateAcquired: {
          label: "Date Acquired",
          sortable: true,
          formatter: function(isoDate) {
            const date = new Date(isoDate);
            return !isNaN(date.getTime()) ? date.toUTCString() : "";
          }
        }
      },
      currentItemPage: 1,
      locatorMap: null,
      selectedTab: null,
      validationErrors: null
    };
  },
  asyncComputed: {
    externalItems: {
      default: [],
      lazy: true,
      async get() {
        const externalItemsLink = this.links.find(x => x.rel === "items");

        if (externalItemsLink == null) {
          return [];
        }

        try {
          const rsp = await fetch(
            `${externalItemsLink.href}?page=${this.currentItemPage}`
          );

          if (!rsp.ok) {
            console.warn(await rsp.text());
            return [];
          }

          const items = await rsp.json();

          if (items.meta != null) {
            // sat-api
            this.externalItemCount = items.meta.found;
            this.externalItemsPerPage = items.meta.limit;
          } else {
            this.externalItemCount = items.features.length;
          }

          // strip /collection from the target path
          let p = this.path.replace(/^\/collection/, "");

          return items.features.map((item, idx) => ({
            item,
            to: `/item${p}/${this.slugify(
              `${externalItemsLink.href}?page=${this.currentItemPage}#${idx}`
            )}`,
            title: item.properties.title || item.id,
            dateAcquired: item.properties.datetime
          }));
        } catch (err) {
          console.warn(err);

          return [];
        }
      }
    }
  },
  computed: {
    ...common.computed,
    ...mapGetters(["getEntity"]),
    _description() {
      return this.catalog.description;
    },
    _items() {
      return this.links.filter(x => x.rel === "item");
    },
    _license() {
      return (
        this.catalog.license || (this.rootCatalog && this.rootCatalog.license)
      );
    },
    _title() {
      return this.catalog.title;
    },
    bands() {
      return (
        this._properties["eo:bands"] ||
        (this.rootCatalog &&
          this.rootCatalog.properties &&
          this.rootCatalog.properties["eo:bands"]) ||
        []
      );
    },
    catalog() {
      return this.entity;
    },
    childCount() {
      return this.links.filter(x => x.rel === "child").length;
    },
    children() {
      return this.links
        .filter(x => x.rel === "child")
        .map(child => ({
          path: child.href,
          slug: this.slugify(this.resolve(child.href, this.url)),
          // child.id is a workaround for https://earthengine-stac.storage.googleapis.com/catalog/catalog.json
          title: child.title || child.id || child.href,
          url: this.resolve(child.href, this.url)
        }));
    },
    extent() {
      return (
        this.catalog.extent ||
        (this.rootCatalog && this.rootCatalog.extent) ||
        {}
      );
    },
    hasExternalItems() {
      return this.links.find(x => x.rel === "items") != null;
    },
    itemCount() {
      if (!this.hasExternalItems) {
        return this.links.filter(x => x.rel === "item").length;
      }

      return this.externalItemCount;
    },
    items() {
      const start = (this.currentPage - 1) * this.perPage;
      const end = this.currentPage * this.perPage;

      if (!this.hasExternalItems) {
        return this._items.map((itemLink, idx) => {
          const itemUrl = this.resolve(itemLink.href, this.url);

          if (idx >= start && idx < end) {
            // dispatch a fetch if item is within the range of items being displayed
            this.load(itemUrl);
          }

          // attempt to load the full item
          const item = this.getEntity(itemUrl);

          if (item != null) {
            return {
              item,
              to: `/item${this.path}/${this.slugify(itemUrl)}`,
              title:
                item.properties.title ||
                item.id ||
                itemLink.title ||
                itemLink.href,
              dateAcquired: item.properties.datetime
            };
          }

          return {
            to: `/item${this.path}/${this.slugify(itemUrl)}`,
            title: itemLink.title || itemLink.href,
            url: itemUrl
          };
        });
      }

      return this.externalItems;
    },
    itemsPerPage() {
      if (this.hasExternalItems) {
        return this.externalItemsPerPage;
      }

      return ITEMS_PER_PAGE;
    },
    jsonLD() {
      const dataCatalog = this.providers.reduce(
        (dc, p) =>
          (p.roles || []).reduce((dc, role) => {
            switch (role) {
              case "licensor":
                dc.copyrightHolder = dc.copyrightHolder || [];
                dc.copyrightHolder.push({
                  "@type": "Organization",
                  description: p.description,
                  name: p.name,
                  url: p.url
                });
                break;

              case "producer":
                dc.producer = dc.producer || [];
                dc.producer.push({
                  "@type": "Organization",
                  description: p.description,
                  name: p.name,
                  url: p.url
                });
                break;

              case "processor":
                dc.contributor = dc.contributor || [];
                dc.contributor.push({
                  "@type": "Organization",
                  description: p.description,
                  name: p.name,
                  url: p.url
                });
                break;

              case "host":
                dc.provider = dc.provider || [];
                dc.provider.push({
                  "@type": "Organization",
                  description: p.description,
                  name: p.name,
                  url: p.url
                });
                break;
            }

            return dc;
          }, dc),
        {
          "@context": "https://schema.org/",
          "@type": "DataCatalog",
          // required
          name: this.title,
          description: this.description,
          // recommended
          citation: this._properties["sci:citation"],
          identifier: this._properties["sci:doi"] || this.catalog.id,
          keywords: this._keywords,
          license: this.licenseUrl,
          isBasedOn: this.url,
          version: this.version,
          url: this.path,
          workExample: (this._properties["sci:publications"] || []).map(p => ({
            identifier: p.doi,
            citation: p.citation
          })),
          hasPart: this.children.map(({ title: name, slug, url }) => ({
            "@type": "DataCatalog",
            name,
            isBasedOn: url,
            url: slug
          })),
          dataset: this.items.map(({ item, title: name, to, url }) => ({
            identifier: item ? item.id : undefined,
            name,
            isBasedOn: url,
            url: to
          }))
        }
      );

      const parent = this.breadcrumbs[this.breadcrumbs.length - 1];

      if (parent != null) {
        dataCatalog.isPartOf = {
          "@type": "DataCatalog",
          name: parent.text,
          isBasedOn: parent.url,
          url: parent.to
        };
      }

      const { spatial, temporal } = this.extent;

      if (spatial != null) {
        dataCatalog.spatialCoverage = {
          "@type": "Place",
          geo: {
            "@type": "GeoShape",
            box: spatial.join(" ")
          }
        };
      }

      if (temporal != null) {
        dataCatalog.temporalCoverage = temporal.map(x => x || "..").join("/");
      }

      return dataCatalog;
    },
    spatialExtent() {
      return this.extent.spatial;
    },
    stacVersion() {
      // REQUIRED
      return this.catalog.stac_version;
    },
    tabIndex: {
      get: function() {
        return this.visibleTabs.indexOf(this.selectedTab);
      },
      set: function(tabIndex) {
        // wait for the DOM to update
        this.$nextTick(() => {
          this.selectedTab = this.visibleTabs[tabIndex];
        });
      }
    },
    temporalExtent() {
      const { temporal } = this.extent;

      if (temporal == null) {
        return null;
      }

      return [
        temporal[0]
          ? new Date(temporal[0]).toLocaleString()
          : "beginning of time",
        temporal[1] ? new Date(temporal[1]).toLocaleString() : "now"
      ].join(" - ");
    },
    version() {
      return this.catalog.version;
    },
    visibleTabs() {
      return [
        this.childCount > 0 && "catalogs",
        (this.hasExternalItems || this.itemCount > 0) && "items",
        this.bands.length > 0 && "bands"
      ].filter(x => x != null && x !== false);
    }
  },
  watch: {
    ...common.watch,
    currentChildPage(to, from) {
      if (to !== from) {
        this.updateState({
          cp: to
        });
      }
    },
    currentItemPage(to, from) {
      if (to !== from) {
        this.updateState({
          ip: to
        });
      }
    },
    selectedTab(to, from) {
      if (to !== from) {
        this.updateState({
          t: to
        });
      }
    }
  },
  methods: {
    ...common.methods,
    ...mapActions(["load"]),
    initialize() {
      if (this.spatialExtent != null) {
        this.$nextTick(() => this.initializeLocatorMap());
      }

      this.syncWithQueryState(this.$route.query);
    },
    initializeLocatorMap() {
      if (this.locatorMap != null) {
        this.locatorMap.remove();
      }

      this.locatorMap = Leaflet.map("locator-map", {
        attributionControl: false,
        zoomControl: false,
        boxZoom: false,
        doubleClickZoom: false,
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false
      });

      Leaflet.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        {
          attribution: `Map data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>`
        }
      ).addTo(this.locatorMap);
      Leaflet.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
        {
          zIndex: 1000
        }
      ).addTo(this.locatorMap);

      const [minX, minY, maxX, maxY] = this.spatialExtent;
      const coordinates = [
        [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]]
      ];

      const overlayLayer = Leaflet.geoJSON(
        {
          type: "Polygon",
          coordinates
        },
        {
          pane: "tilePane",
          style: {
            weight: 2,
            color: "#ffd65d",
            opacity: 1,
            fillOpacity: 0.15
          }
        }
      ).addTo(this.locatorMap);

      this.locatorMap.fitBounds(overlayLayer.getBounds(), {
        padding: [95, 95]
      });
    },
    sortCompare(a, b, key) {
      if (key === "link") {
        key = "title";
      }

      if (a[key] == null) {
        return -1;
      } else if (b[key] == null) {
        return 1;
      } else if (typeof a[key] === "number" && typeof b[key] === "number") {
        // If both compared fields are native numbers
        return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
      } else {
        // Stringify the field data and use String.localeCompare
        return a[key].toString().localeCompare(b[key].toString(), undefined, {
          numeric: true
        });
      }
    },
    syncWithQueryState(qs) {
      this.selectedTab = qs.t;
      this.currentChildPage = Number(qs.cp) || this.currentChildPage;
      this.currentItemPage = Number(qs.ip) || this.currentItemPage;
    }
  }
};
</script>

<style scoped lang="css">
h3 {
  margin-top: 25px;
  margin-bottom: 25px;
}

th h3 {
  margin-top: 0;
  margin-bottom: 0;
}

.table th {
  border-top: none;
  border-bottom: 1px solid #dee2e6;
}

td.provider {
  border: none;
  padding-top: 0;
  padding-bottom: 0;
}

td.provider .description {
  padding-left: 5px;
  font-style: italic;
}

td.title {
  font-weight: bold;
  width: 40%;
}

.leaflet-container {
  background-color: #262626;
}

#locator-map {
  height: 200px;
  width: 100%;
  margin-bottom: 10px;
}
</style>
