<template>
  <div>
    <b-alert v-if="errored" variant="danger" show>
      <p>{{ _entity.message }}</p>
      <p>Please note that some servers don't allow external access via web browsers (e.g., when CORS headers are not present).</p>
      <p>Errored URL: {{ url }}</p>
      <p><a href="#" @click="$router.go(-1)">Go back</a></p>
    </b-alert>
    <b-spinner v-else-if="!loaded" label="Loading..."></b-spinner>
    <b-container v-else :class="loaded && 'loaded'">
      <b-row>
        <b-col md="12">
          <header>
            <b-breadcrumb :items="breadcrumbs" />
          </header>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          :md="
            keywords.length > 0 || license != null || spatialExtent.length > 0
              ? 8
              : 12
          "
        >
          <h1 class="scroll">{{ title }}</h1>
          <p v-if="version">
            <small>Version {{ version }}</small>
          </p>
          <p class="scroll">
            <small>
              <span
                v-if="validationErrors"
                title="Validation errors present; please check the JavaScript Console"
                >⚠️</span
              >
              <code>{{ url }}</code>
            </small>
          </p>
          <div v-if="description" v-html="description" />

          <b-tabs v-model="tabIndex">
            <b-tab
              v-if="visibleTabs.includes('collections')"
              key="collections"
              title="Collections (API)"
            >
              <b-table
                :items="collections"
                :fields="collectionFields"
                :per-page="childrenPerPage"
                :current-page="currentCollectionPage"
                :outlined="true"
                responsive
                small
                striped
              >
                <template slot="cell(link)" slot-scope="data">
                  <router-link :to="data.item.to">{{
                    data.item.id
                  }}</router-link>
                </template>
              </b-table>
              <b-pagination
                v-if="collectionCount > childrenPerPage"
                v-model="currentCollectionPage"
                :limit="15"
                :total-rows="collectionCount"
                :per-page="childrenPerPage"
                :hide-goto-end-buttons="true"
              />
            </b-tab>

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
                <template slot="cell(link)" slot-scope="data">
                  <router-link :to="data.item.to">{{
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
                :current-page="currentItemListPage"
                :sort-compare="sortCompare"
                :outlined="true"
                responsive
                small
                striped
              >
                <template slot="cell(link)" slot-scope="data">
                  <router-link :to="data.item.to">{{
                    data.item.title
                  }}</router-link>
                </template>
                <!-- TODO row-details w/ additional metadata + map -->
              </b-table>
              <b-pagination
                v-if="itemCount > itemsPerPage"
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
            <ZarrMetadataTab
              v-if="visibleTabs.includes('zarrMetadata')"
              :active="false"
              :zarr-metadata-url="zarrMetadataUrl"
            ></ZarrMetadataTab>
            <AssetTab
              v-if="visibleTabs.includes('assets')"
              :assets="assets"
              :bands="bands"
              :hasBands="hasBands"
              :active="false"
            ></AssetTab>
            <LinkTab
              v-if="visibleTabs.includes('links')"
              :links="shownLinks"
              :active="false"
            ></LinkTab>
          </b-tabs>
        </b-col>
        <b-col
          v-if="keywords.length > 0 || license != null || spatialExtent.length > 0"
          md="4"
        >
          <b-card bg-variant="light">
            <div v-if="spatialExtent.length > 0" id="locator-map" />
            <MetadataSidebar
              :properties="properties"
              :summaries="summaries"
              :stacVersion="stacVersion"
              :keywords="keywords"
              :license="license"
              :temporalExtent="temporalExtent"
              :providers="providers"
            />
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

import Migrate from '@radiantearth/stac-migrate';

import { fetchUri } from "../util";

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
  components: {
    LinkTab: () => import(/* webpackChunkName: "link-tab" */ "./LinkTab.vue"),
    AssetTab: () => import(/* webpackChunkName: "asset-tab" */ "./AssetTab.vue"),
    MetadataSidebar: () => import(/* webpackChunkName: "metadata-sidebar" */ "./MetadataSidebar.vue"),
    ZarrMetadataTab: () => import(/* webpackChunkName: "zarr-metadata-tab" */ './ZarrMetadataTab.vue')
  },
  data() {
    return {
      stacVersion: null,
      externalItemCount: 0,
      externalItemsPerPage: 0,
      externalItemPaging: false,
      childFields: [
        {
          key: "link",
          label: "Title",
          sortable: true
        }
      ],
      collectionFields: [
        {
          key: "link",
          label: "Identifier",
          sortable: false // Sorting doesn't work for links
        },
        {
          key: "title",
          label: "Title",
          sortable: true
        }
      ],
      currentChildPage: 1,
      currentCollectionPage: 1,
      childrenPerPage: 25, // also applies to collections
      itemFields: [
        {
          key: "link",
          label: "Title",
          sortable: false // Sorting doesn't work for links
        },
        {
          key: "dateAcquired",
          label: "Date Acquired",
          sortable: true,
          formatter: function(isoDate) {
            if (isoDate != null) {
              const date = new Date(isoDate);
              return !isNaN(date.getTime()) ? date.toUTCString() : "";
            }

            return "";
          }
        }
      ],
      currentItemPage: 1,
      currentItemListPage: 1,
      locatorMap: null,
      selectedTab: null,
      validationErrors: null
    };
  },
  asyncComputed: {
    collections: {
      default: [],
      lazy: true,
      async get() {
        const externalCollections = this.links.find(x => x.rel === "data");
        if (externalCollections === undefined) {
          return [];
        }

        try {
          const rsp = await fetchUri(externalCollections.href);
          if (!rsp.ok) {
            console.warn(await rsp.text());
            return [];
          }

          const data = await rsp.json();
          if (!data || !Array.isArray(data.collections)) {
            console.warn(await rsp.text());
            return [];
          }

          return data.collections
            .map(collection => {
              // strip /collection from the target path
              let p = this.path.replace(/^\/collection/, "");
              if (!p.endsWith("/")) {
                p += "/";
              }

              // Try to get the location of the collection
              let href = externalCollections.href + '/collections/' + collection.id;
              if (Array.isArray(collection.links)) {
                let selfLink = collection.links.find(l => l.rel == 'self');
                if (selfLink && selfLink.href) {
                  href = selfLink.href;
                }
              }

              const resolved = this.resolve(href, this.url);
              const slug = this.slugify(resolved);
              const to = [p, slug].join("");

              return Object.assign(collection, {
                path: href,
                to,
                title: collection.title || collection.id || href,
                url: resolved
              });
            });
        } catch (err) {
          console.warn(err);

          return [];
        }
      }
    },
    externalItems: {
      default: [],
      lazy: true,
      async get() {
        const externalItemsLink = this.links.find(x => x.rel === "items");

        if (externalItemsLink === undefined) {
          return [];
        }

        try {
          const rsp = await fetchUri(
            `${externalItemsLink.href}?page=${this.currentItemPage}`
          );

          if (!rsp.ok) {
            console.warn(await rsp.text());
            return [];
          }

          const items = await rsp.json();

          // STAC-API Context extension.
          // Account for the old search:metadata extension.
          const context = !!items.context ? (
              items.context
          ) : items["search:metadata"];

          if (context != null) {
            this.externalItemCount = context.matched;
            this.externalItemsPerPage = context.limit;
            this.externalItemPaging = true;
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
    _entity() {
      let object = this.getEntity(this.url);
      this.stacVersion = object.stac_version; // Store the original stac_version as it gets replaced by the migration
      let cloned = JSON.parse(JSON.stringify(object)); // Clone to avoid changing the vuex store, remove once migration is done directly in vuex
      return Migrate.stac(cloned);
    },
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
      // ToDo: Merge all bands from assets
      return (
        this._properties["eo:bands"] ||
        this.summaries['eo:bands'] ||
        (this.rootCatalog &&
          this.rootCatalog.properties &&
          this.rootCatalog.properties["eo:bands"]) ||
        []
      );
    },
    catalog() {
      return this.entity;
    },
    collectionCount() {
      return this.collections.length;
    },
    childCount() {
      return this.children.length;
    },
    children() {
      return this.links
        .filter(x => x.rel === "child")
        .map(child => {
          // strip /collection from the target path
          let p = this.path.replace(/^\/collection/, "");

          if (!p.endsWith("/")) {
            p += "/";
          }

          const resolved = this.resolve(child.href, this.url);
          const slug = this.slugify(resolved);
          const to = [p, slug].join("");

          return {
            path: child.href,
            to,
            // child.id is a workaround for https://earthengine-stac.storage.googleapis.com/catalog/catalog.json
            title: child.title || child.id || child.href,
            url: resolved
          };
        });
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
      const start = (this.currentItemPage - 1) * this.itemsPerPage;
      const end = this.currentItemPage * this.itemsPerPage;

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
                itemLink.title ||
                item.id ||
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
      if (this.externalItemPaging) {
        return this.externalItemsPerPage;
      }

      return ITEMS_PER_PAGE;
    },
    jsonLD() {
      const dataCatalog = this.providers.reduce(
        (dc, p) => {
          let roles = Array.isArray(p.roles) ? p.roles : [];

          return roles.reduce((dc, role) => {
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
            }, dc)
            },
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
          hasPart: this.children.map(({ title: name, to, url }) => ({
            "@type": "DataCatalog",
            name,
            isBasedOn: url,
            url: to
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

      if (this.spatialExtent.length > 0) {
        dataCatalog.spatialCoverage = {
          "@type": "Place",
          geo: {
            "@type": "GeoShape",
            // ToDo: compute min and max values from multiple extents
            box: this.spatialExtent[0].join(" ")
          }
        };
      }

      if (this.temporalExtent.length > 0) {
        // ToDo: compute min and max values from multiple extents
        dataCatalog.temporalCoverage = this.temporalExtent[0].map(x => x || "..").join("/");
      }

      return dataCatalog;
    },
    properties() {
      return this._properties;
    },
    spatialExtent() {
      const { spatial } = this.extent;
      if (!spatial || typeof spatial !== 'object' || !Array.isArray(spatial.bbox)) {
          return [];
      }

      return spatial.bbox.filter(box => Array.isArray(box) && box.length >= 4);
    },
    summaries() {
      return this.catalog.summaries || {};
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
      if (!temporal || typeof temporal !== 'object' || !Array.isArray(temporal.interval)) {
          return [];
      }

      return temporal.interval.filter(box => Array.isArray(box) && box.length === 2);
    },
    version() {
      return this.catalog.version;
    },
    visibleTabs() {
      return [
        this.collectionCount > 0 && "collections",
        this.childCount > 0 && "catalogs",
        (this.hasExternalItems || this.itemCount > 0) && "items",
        this.bands.length > 0 && "bands",
        Object.keys(this.summaries).length && "summaries",
        this.assets.length > 0 && "assets",
        this.shownLinks.length > 0 && "links",
        this.zarrMetadataUrl && "zarrMetadata"
      ].filter(x => !!x);
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
      if (this.spatialExtent.length > 0) {
        this.$nextTick(() => this.initializeLocatorMap());
      }

      this.syncWithQueryState(this.$route.query);
    },
    initializeLocatorMap() {
      if (this.locatorMap != null) {
        this.locatorMap.remove();
      }

      if (this.spatialExtent.length === 0) {
        // no spatial extent; skip
        return;
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

      const coordinates = [this.spatialExtent.map(extent => {
        const [minX, minY, maxX, maxY] = extent;
        return [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]];
      })];

      const overlayLayer = Leaflet.geoJSON(
        {
          type: "MultiPolygon",
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
      this.currentChildPage = Number(qs.cp) || 1;
      this.currentItemPage = Number(qs.ip) || 1;

      // If we have external items, the b-table needs to "stay" on page 1 as
      // the items list only contains the number of items we want to show.
      this.currentItemListPage = this.hasExternalItems ? 1 : this.currentItemPage;
    }
  }
};
</script>

<style src="./base.css"></style>

<style scoped lang="css">
h3 {
  margin-top: 25px;
  margin-bottom: 25px;
}

th h3 {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 16px;
  text-transform: uppercase;
  color: #555;
  font-weight: normal;
}

.table th {
  border-top: none;
  border-bottom: 1px solid #dee2e6;
}

td.provider {
  border: none;
  padding: 0 15px;
}

td.provider .description {
  padding-left: 5px;
  font-style: italic;
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
