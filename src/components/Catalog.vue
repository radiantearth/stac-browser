<template>
  <b-container :class="loaded && 'loaded'">
    <b-row>
      <b-col md="12">
        <header>
          <b-breadcrumb :items="breadcrumbs"/>
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
        <h1>{{ title }}</h1>
        <p v-if="version">
          <small>Version {{ version }}</small>
        </p>
        <p>
          <template v-if="validationErrors">
            <span title="Validation errors present; please check the JavaScript Console">⚠️</span>
          </template>
          <small>
            <code>{{ url }}</code>
          </small>
        </p>
        <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
        <div v-if="description" v-html="description"/>

        <template v-if="childCount > 0">
          <h3>Catalogs</h3>
          <b-pagination
            v-if="childCount > childrenPerPage"
            v-model="currentChildPage"
            :total-rows="childCount"
            :per-page="childrenPerPage"
            :hide-goto-end-buttons="true"
          />
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
              <router-link :to="data.item.slug">{{ data.item.title }}</router-link>
            </template>
          </b-table>
          <b-pagination
            v-if="childCount > childrenPerPage"
            v-model="currentChildPage"
            :total-rows="childCount"
            :per-page="childrenPerPage"
            :hide-goto-end-buttons="true"
          />
        </template>

        <div v-if="itemCount > 0" class="items">
          <b-pagination
            v-if="itemCount > itemsPerPage"
            v-model="currentItemPage"
            :total-rows="itemCount"
            :per-page="itemsPerPage"
            :hide-goto-end-buttons="true"
          />
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
              <router-link :to="data.item.to">{{ data.item.title }}</router-link>
            </template>
            <!-- TODO row-details w/ additional metadata + map -->
          </b-table>
          <b-pagination
            v-if="itemCount > itemsPerPage"
            v-model="currentItemPage"
            :total-rows="itemCount"
            :per-page="itemsPerPage"
            :hide-goto-end-buttons="true"
          />
        </div>
      </b-col>
      <b-col v-if="keywords.length > 0 || license != null" md="4">
        <b-card title="Catalog Information" bg-variant="light">
          <div v-if="spatialExtent" id="locator-map"/>
          <div class="table-responsive">
            <table class="table">
              <tbody>
                <template v-if="providers">
                  <tr>
                    <th colspan="2">
                      <h3>
                        <template v-if="providers.length === 1">Provider</template>
                        <template v-if="providers.length !== 1">Providers</template>
                      </h3>
                    </th>
                  </tr>
                  <template v-for="(provider, index) in providers">
                    <tr :key="provider.url + index">
                      <td colspan="2" class="provider">
                        <a :href="provider.url">{{ provider.name }}</a>
                        <em>({{ (provider.roles || []).join(", ") }})</em>
                      </td>
                    </tr>
                    <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
                    <tr
                      v-if="provider.description"
                      :key="provider.name + index"
                      v-html="provider.description"
                    />
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
                  <td v-html="license"/>
                </tr>
                <tr v-if="spatialExtent">
                  <td class="title">Spatial Extent</td>
                  <td>{{ spatialExtent.join(", ") }}</td>
                </tr>
                <tr v-if="temporalExtent">
                  <td class="title">Temporal Extent</td>
                  <td>{{ temporalExtent }}</td>
                </tr>
                <tr v-for="prop in propertyList" :key="prop.key">
                  <td class="title">
                    <span :title="prop.key">{{ prop.label }}</span>
                  </td>
                  <td>{{ prop.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Leaflet from "leaflet";
import { mapActions, mapGetters } from "vuex";

import common from "./common";

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
      itemsPerPage: 25,
      locatorMap: null,
      validationErrors: null
    };
  },
  computed: {
    ...common.computed,
    ...mapGetters(["getEntity"]),
    _description() {
      return this.catalog.description;
    },
    _license() {
      return (
        this.catalog.license || (this.rootCatalog && this.rootCatalog.license)
      );
    },
    _title() {
      return this.catalog.title;
    },
    catalog() {
      return this.entity;
    },
    childCount() {
      return this.links.filter(x => x.rel === "child").length;
    },
    children() {
      return this.links.filter(x => x.rel === "child").map(child => ({
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
    itemCount() {
      return this.links.filter(x => x.rel === "item").length;
    },
    items() {
      // TODO move to async computed and pull from rel=items if necessary

      const start = (this.currentPage - 1) * this.perPage;
      const end = this.currentPage * this.perPage;
      return this.links.filter(x => x.rel === "item").map((itemLink, idx) => {
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
    },
    jsonLD() {
      const dataCatalog = this.providers.reduce(
        (dc, p) =>
          p.roles.reduce((dc, role) => {
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
    }
  },
  methods: {
    ...common.methods,
    ...mapActions(["load"]),
    initialize() {
      if (this.spatialExtent != null) {
        this.initializeLocatorMap();
      }
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
            weight: 3,
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
}

h4 {
  font-weight: bold;
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

td.title {
  font-weight: bold;
  width: 40%;
}

ul.links,
ul.items {
  margin: 0 0 1em;
  list-style-type: none;
  padding: 0;
}

.leaflet-container {
  background-color: #262626;
}

div.items {
  margin-top: 25px;
}

#locator-map {
  height: 200px;
  width: 100%;
  margin-bottom: 10px;
}
</style>
