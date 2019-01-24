<template>
  <b-container :class="loaded && 'loaded'">
    <div ref="renderedState"/>
    <div ref="metadata"/>
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
        <template v-if="providers != null && providers.length > 0">
          <h2>Provider
            <template v-if="providers.length > 1">s</template>
          </h2>
          <dl>
            <template v-for="provider in providers">
              <dt :key="provider.url">
                <a :href="provider.url">{{ provider.name }}</a> (
                <em>{{ (provider.roles || []).join(", ") }}</em>)
              </dt>
              <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
              <dd :key="provider.name" v-html="provider.description"/>
            </template>
          </dl>
        </template>

        <template v-if="children.length > 0">
          <hr>

          <h3>Catalogs</h3>
          <ul class="links">
            <li v-for="child in children" :key="child.path">
              <router-link :to="child.slug" append>{{ child.title }}</router-link>
            </li>
          </ul>
        </template>
      </b-col>
      <b-col v-if="keywords.length > 0 || license != null" md="4">
        <b-card title="Catalog Information" bg-variant="light" class="float-right">
          <div v-if="spatialExtent" id="locator-map"/>
          <div class="table-responsive">
            <table class="table">
              <tbody>
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
                  <td>{{ spatialExtent }}</td>
                </tr>
                <tr v-if="temporalExtent">
                  <td class="title">Temporal Extent</td>
                  <td>{{ temporalExtent }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </b-card>
      </b-col>
    </b-row>

    <b-row v-if="items.length > 0">
      <b-col md="12">
        <h3>Items</h3>
        <b-pagination
          v-model="currentPage"
          :total-rows="itemCount"
          :per-page="perPage"
          :hide-goto-end-buttons="true"
        />
        <b-table
          :items="items"
          :fields="itemFields"
          :per-page="perPage"
          :current-page="currentPage"
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
          v-model="currentPage"
          :total-rows="itemCount"
          :per-page="perPage"
          :hide-goto-end-buttons="true"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import clone from "clone";
import { HtmlRenderer, Parser } from "commonmark";
import jsonQuery from "json-query";
import Leaflet from "leaflet";
import isEqual from "lodash.isequal";
import spdxToHTML from "spdx-to-html";
import { mapActions, mapGetters } from "vuex";

const MARKDOWN_READER = new Parser({
  smart: true
});
const MARKDOWN_WRITER = new HtmlRenderer({
  safe: true,
  softbreak: "<br />"
});

export default {
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
      currentPage: 1,
      perPage: 25,
      locatorMap: null,
      validationErrors: null
    };
  },
  computed: {
    ...mapGetters(["getEntity"]),
    loaded() {
      return this.catalog != null;
    },
    breadcrumbs() {
      // create slugs for everything except the root
      const slugs = this.ancestors.slice(1).map(this.slugify);

      return this.ancestors.map((uri, idx) => {
        const entity = this.getEntity(uri);

        // use all previous slugs to construct a path to this entity
        let to = "/" + slugs.slice(0, idx).join("/");

        return {
          to,
          text: entity.title || entity.id,
          url: uri
        };
      });
    },
    catalog() {
      return this.getEntity(this.url);
    },
    children() {
      return this.catalog.links.filter(x => x.rel === "child").map(child => ({
        path: child.href,
        slug: this.slugify(this.resolve(child.href, this.url)),
        title: child.title || child.href,
        url: this.resolve(child.href, this.url)
      }));
    },
    description() {
      // REQUIRED
      return MARKDOWN_WRITER.render(
        MARKDOWN_READER.parse(this.catalog.description)
      );
    },
    id() {
      // REQUIRED
      return this.catalog.id;
    },
    extent() {
      return this.catalog.extent || this.rootCatalog.extent || {};
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
          identifier: this.catalog.id,
          keywords: this.catalog.keywords || this.rootCatalog.keywords,
          license: this.catalog.license || this.rootCatalog.license,
          isBasedOn: this.url,
          version: this.version,
          url: this.url,
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
    keywords() {
      return []
        .concat(this.catalog.keywords || this.rootCatalog.keywords || [])
        .join(", ");
    },
    license() {
      return spdxToHTML(this.catalog.license || this.rootCatalog.license);
    },
    links() {
      // REQUIRED
      return this.catalog.links;
    },
    providers() {
      return (this.catalog.providers || this.rootCatalog.providers || []).map(
        x => ({
          ...x,
          description: MARKDOWN_WRITER.render(
            MARKDOWN_READER.parse(x.description || "")
          )
        })
      );
    },
    rootCatalog() {
      const rootLink = this.links.find(x => x.rel === "root");

      if (rootLink != null) {
        return this.getEntity(this.resolve(rootLink.href, this.url));
      }

      return this.getEntity(this.ancestors[0]);
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
    title() {
      if (this.catalog.title != null) {
        return `${this.catalog.title} (${this.id})`;
      }

      return this.id;
    },
    version() {
      return this.catalog.version;
    }
  },
  watch: {
    catalog(to, from) {
      if (!isEqual(to, from)) {
        this._updateMetadata();
        this._updateState();
        this._validate(to);
      }
    }
  },
  mounted() {
    this.initialize();

    this._validate(this.catalog);
  },
  updated() {
    this.initialize();
  },
  methods: {
    ...mapActions(["load"]),
    initialize() {
      if (this.spatialExtent != null) {
        this.initializeLocatorMap();
      }

      this._updateMetadata();
      this._updateState();
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
    },
    _updateMetadata() {
      const s = document.createElement("script");
      s.setAttribute("type", "application/ld+json");

      s.text = JSON.stringify(this.jsonLD);

      const { metadata } = this.$refs;

      if (metadata.hasChildNodes()) {
        metadata.replaceChild(s, metadata.firstChild);
      } else {
        metadata.appendChild(s);
      }
    },
    _updateState() {
      if (this.path == null) {
        return;
      }

      const s = document.createElement("script");
      s.setAttribute("type", "application/json");
      s.setAttribute("class", "state");
      s.text = JSON.stringify({
        path: this.path
      });

      const { renderedState } = this.$refs;

      if (renderedState.hasChildNodes()) {
        renderedState.replaceChild(s, renderedState.firstChild);
      } else {
        renderedState.appendChild(s);
      }
    },
    _validate(data) {
      const errors = this.validate(data);

      if (errors != null) {
        console.group("Validation errors");
        errors.forEach(err => {
          console.warn(`${err.dataPath} ${err.message}:`);
          const { value } = jsonQuery(err.dataPath, {
            data
          });
          console.warn(clone(value));
        });
        console.groupEnd();
      }

      this.validationErrors = errors;
    }
  }
};
</script>

<style scoped lang="css">
h4 {
  font-weight: bold;
}

td.title {
  font-weight: bold;
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

#locator-map {
  height: 200px;
  width: 100%;
  margin-bottom: 10px;
}
</style>
