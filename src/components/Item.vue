<template>
  <b-container :class="loaded && 'loaded'">
    <b-row>
      <b-col md="12">
        <header>
          <!-- <a href="https://www.planet.com/disasterdata/">
            <img
              id="header_logo"
              src="https://planet-pulse-assets-production.s3.amazonaws.com/uploads/2016/06/blog-logo.jpg"
              alt="Powered by Planet Labs"
              class="float-right">
          </a>-->
          <div>
            <b-breadcrumb :items="breadcrumbs"/>
          </div>
          <h1>{{ title }}</h1>
          <p>
            <span
              v-if="validationErrors"
              title="Validation errors present; please check the JavaScript Console"
            >⚠️</span>
            <small>
              <code>{{ url }}</code>
            </small>
          </p>
        </header>
      </b-col>
    </b-row>

    <hr>

    <div class="row">
      <div class="col-md-8">
        <b-tabs>
          <b-tab v-if="cog != null" title="Preview" :active="cog != null">
            <div id="map-container">
              <div id="map"></div>
            </div>
          </b-tab>
          <b-tab v-if="thumbnail" title="Thumbnail" :active="cog == null && thumbnail != null">
            <a :href="thumbnail">
              <img id="thumbnail" align="center" :src="thumbnail">
            </a>
          </b-tab>
          <b-tab v-if="assets.length > 0" title="Assets" :active="cog == null && thumbnail == null">
            <div class="table-responsive assets">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Content-Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="asset in assets" :key="asset.key">
                    <td>
                      <!-- eslint-disable-next-line vue/max-attributes-per-line vue/no-v-html -->
                      <a :href="asset.href" :title="asset.key" v-html="asset.title"/>
                    </td>
                    <td>
                      <code>{{ asset.type }}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </b-tab>
        </b-tabs>
      </div>

      <div class="col-md-4">
        <div id="locator-map"></div>
        <div class="table-responsive metadata">
          <table class="table">
            <tbody>
              <tr v-if="collection">
                <td class="title">Collection</td>
                <td>
                  <a :href="linkToCollection">
                    {{
                    collection.title || "Untitled"
                    }}
                  </a>
                </td>
              </tr>
              <tr v-if="license">
                <td class="title">License</td>
                <td>
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="license"></span>
                  <template v-if="licensor">by
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span v-html="licensor"></span>
                  </template>
                </td>
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
      </div>
    </div>
  </b-container>
</template>

<script>
import path from "path";

import clone from "clone";
import jsonQuery from "json-query";
import escape from "lodash.escape";
import isEqual from "lodash.isequal";
import Leaflet from "leaflet";
import "leaflet-easybutton";
import spdxToHTML from "spdx-to-html";
import { mapActions, mapGetters } from "vuex";

import dictionary from "../lib/stac/dictionary.json";

export default {
  name: "ItemDetail",
  metaInfo() {
    return {
      script: [
        { innerHTML: JSON.stringify(this.jsonLD), type: "application/ld+json" },
        {
          innerHTML: JSON.stringify({
            path: this.path
          }),
          class: "state",
          type: "application/ld+json"
        }
      ],
      __dangerouslyDisableSanitizers: ["script"],
      title: this.title,
      titleTemplate: "%s ⸬ STAC Browser"
    };
  },
  props: {
    ancestors: {
      type: Array,
      required: true
    },
    center: {
      type: Array,
      default: null
    },
    fullscreen: {
      type: Boolean,
      default: false
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
      locatorMap: null,
      map: null,
      previewLayer: null,
      overlayLayer: null,
      locatorOverlayLayer: null,
      geojsonOptions: {
        style: function() {
          return {
            weight: 2,
            color: "#333",
            opacity: 1,
            fillOpacity: 0
          };
        }
      },
      validationErrors: null
    };
  },
  computed: {
    ...mapGetters(["getEntity"]),
    loaded() {
      return this.item != null;
    },
    breadcrumbs() {
      // create slugs for everything except the root
      const slugs = this.ancestors.slice(1).map(this.slugify);

      return this.ancestors.map((uri, idx) => {
        const entity = this.getEntity(uri);

        // use all previous slugs to construct a path to this entity
        let to = "/" + slugs.slice(0, idx).join("/");

        if (entity != null) {
          return {
            to,
            text: entity.title || entity.id
          };
        }

        return {
          to
        };
      });
    },
    item() {
      const item = this.getEntity(this.url);

      if (item instanceof Error) {
        this.$router.replace("/");
        return;
      }

      return item;
    },
    cog() {
      // TODO find all relevant sources and surface in a dropdown
      const cog = this.assets
        .filter(x => x.type === "image/vnd.stac.geotiff; cloud-optimized=true")
        // prefer COGs with "visual" key
        .sort((a, b) => a.key.indexOf("visual") - b.key.indexOf("visual"))
        .pop();

      if (cog != null) {
        return this.resolve(cog.href, this.url);
      }
    },
    thumbnail() {
      const thumbnail = this.assets.find(x => x.key === "thumbnail");

      if (thumbnail != null) {
        return this.resolve(thumbnail.href, this.url);
      }
    },
    tileSource() {
      if (this.cog == null) {
        return "";
      }

      // TODO global config
      return `https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=${encodeURIComponent(
        this.cog
      )}`;
      // return `http://localhost:8000/tiles/{z}/{x}/{y}@2x?url=${encodeURIComponent(
      //   this.cog
      // )}`;
    },
    jsonLD() {
      const dataset = {
        "@context": "https://schema.org/",
        "@type": "Dataset",
        // required
        name: this.title,
        description: this.properties.description,
        // recommended
        identifier: this.item.id,
        keywords: this.keywords,
        license: this.licenseUrl,
        isBasedOn: this.url,
        url: this.path,
        includedInDataCatalog: [this.collectionLink, this.parentLink]
          .filter(x => !!x)
          .map(l => ({
            isBasedOn: l.href,
            url: l.slug
          })),
        spatialCoverage: {
          "@type": "Place",
          geo: {
            "@type": "GeoShape",
            box: (this.item.bbox || []).join(" ")
          }
        },
        temporalCoverage: this.properties.datetime,
        distribution: this.assets.map(a => ({
          contentUrl: a.href,
          fileFormat: a.type,
          name: a.title
        })),
        image: this.thumbnail
      };

      return dataset;
    },
    links() {
      if (typeof this.item.links === "object") {
        // previous STAC version specified links as an object
        return Object.values(this.item.links);
      }

      return this.item.links || [];
    },
    assets() {
      return (
        Object.keys(this.item.assets)
          .map(key => ({
            ...this.item.assets[key],
            key
          }))
          .map(x => ({
            ...x,
            title:
              escape(x.title) ||
              `<code>${escape(path.basename(x.href))}</code>`,
            href: new URL(x.href, this.url).toString()
          }))
          // prioritize assets w/ a format set
          .sort((a, b) => {
            const formatA = a.format || "zzz";
            const formatB = b.format || "zzz";

            if (formatA < formatB) {
              return -1;
            }

            if (formatA > formatB) {
              return 1;
            }

            return 0;
          })
      );
    },
    propertyList() {
      const label = key => {
        if (typeof dictionary[key] === "object") {
          return dictionary[key].label;
        }

        return dictionary[key] || key;
      };

      const format = (key, value) => {
        let suffix = "";

        if (typeof dictionary[key] === "object") {
          if (dictionary[key].suffix != null) {
            suffix = dictionary[key].suffix;
          }

          if (dictionary[key].type === "date") {
            return (
              new Date(value).toLocaleString([], {
                timeZone: "UTC",
                timeZoneName: "short"
              }) + suffix
            );
          }

          if (dictionary[key].type === "eo:bands") {
            return value.map(band => band.common_name).join(", ");
          }
        }

        return value + suffix;
      };

      const collectionProps = this.collection && this.collection.properties;

      const props = {
        ...collectionProps,
        ...this.item.properties
      };

      return Object.keys(props)
        .filter(k => props[k] != null)
        .map(key => ({
          key,
          label: label(key),
          value: format(key, props[key])
        }));
    },
    keywords() {
      return (
        (this.collection && this.collection.keywords) ||
        this.rootCatalog.keywords ||
        []
      );
    },
    _license() {
      return (
        this.properties["item:license"] ||
        (this.collection && this.collection.license) ||
        this.rootCatalog.license
      );
    },
    license() {
      if (this._license === "proprietary") {
        if (this.licenseUrl != null) {
          return `<a href="${this.licenseUrl}">${this._license}</a>`;
        }

        return this._license;
      }

      return spdxToHTML(this._license);
    },
    licenseUrl() {
      if (this._license === "proprietary") {
        return this.links
          .concat(
            ((this.collection && this.collection.links) || []).concat(
              (this.rootCatalog && this.rootCatalog.links) || []
            )
          )
          .filter(x => x.rel === "license")
          .map(x => x.href)
          .pop();
      }

      return `https://spdx.org/licenses/${this._license}.html`;
    },
    licensor() {
      return this.providers
        .filter(x => x.roles.includes("licensor"))
        .map(x => {
          if (x.url != null) {
            return `<a href=${x.url}>${x.name}</a>`;
          }

          return x.name;
        })
        .pop();
    },
    providers() {
      return (
        this.properties["item:providers"] ||
        (this.collection && this.collection.providers) ||
        this.rootCatalog.providers ||
        []
      );
    },
    properties() {
      return this.item.properties || {};
    },
    rootCatalog() {
      const rootLink = this.links.find(x => x.rel === "root");

      if (rootLink != null) {
        return this.getEntity(this.resolve(rootLink.href, this.url));
      }

      return this.getEntity(this.ancestors[0]);
    },
    title() {
      return this.properties.title || this.item.id;
    },
    collection() {
      if (this.collectionLink != null) {
        this.load(this.collectionLink.href);

        return this.getEntity(this.collectionLink.href);
      }
    },
    collectionLink() {
      return this.links
        .filter(x => x.rel === "collection")
        .map(x => ({
          ...x,
          href: this.resolve(x.href, this.url),
          slug: this.slugify(this.resolve(x.href, this.url))
        }))
        .pop();
    },
    parentLink() {
      return this.links
        .filter(x => x.rel === "parent")
        .map(x => ({
          ...x,
          href: this.resolve(x.href, this.url),
          slug: this.slugify(this.resolve(x.href, this.url))
        }))
        .pop();
    },
    linkToCollection() {
      if (this.collectionLink.href != null) {
        return `/collection/${this.slugify(this.collectionLink.href)}`;
      }
    },
    attribution() {
      // TODO load attribution from rel=collection
      return null;
      // return `Imagery ${this.properties.license || ""} ${
      //   this.properties.provider
      // }`;

      // TODO license + provider may not be present
      // TODO license may be an object
      // attributionControl.addAttribution(
      //   `Imagery ${this.properties.license || ""} ${this.properties.provider}`
      // );
    }
  },
  watch: {
    fullscreen(to, from) {
      if (to !== from) {
        if (to) {
          this.map.getContainer().classList.add("leaflet-pseudo-fullscreen");
        } else {
          this.map.getContainer().classList.remove("leaflet-pseudo-fullscreen");
        }

        this.map.invalidateSize();
      }
    },
    item(to, from) {
      if (!isEqual(to, from)) {
        this._validate(to);
      }
    }
  },
  mounted() {
    this.initialize();
    this._validate(this.item);
  },
  updated() {
    this.initialize();
  },
  methods: {
    ...mapActions(["load"]),
    initialize() {
      if (this.cog != null) {
        this.initializePreviewMap();
      }
      this.initializeLocatorMap();
    },
    initializeLocatorMap() {
      if (this.locatorMap == null) {
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
            opacity: 0.6,
            zIndex: 1000
          }
        ).addTo(this.locatorMap);
      } else {
        this.locatorOverlayLayer.removeFrom(this.locatorMap);
      }

      this.locatorOverlayLayer = Leaflet.geoJSON(this.item, {
        pane: "tilePane",
        style: {
          weight: 1,
          color: "#ffd65d",
          opacity: 1,
          fillOpacity: 1
        }
      }).addTo(this.locatorMap);

      this.locatorMap.fitBounds(this.locatorOverlayLayer.getBounds(), {
        padding: [95, 95]
      });
    },
    initializePreviewMap() {
      if (this.map == null) {
        this.map = Leaflet.map("map");

        this.map.on("moveend", this.updateHash);
        this.map.on("zoomend", this.updateHash);

        this.map.attributionControl.setPrefix("");

        this.button = Leaflet.easyButton(
          "fas fa-expand fa-2x",
          () => this.onFullscreenChange(!this.fullscreen),
          {
            position: "topright"
          }
        ).addTo(this.map);

        if (this.fullscreen) {
          this.map.getContainer().classList.add("leaflet-pseudo-fullscreen");
        }

        Leaflet.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
          {
            attribution: `Map data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>`
          }
        ).addTo(this.map);
        Leaflet.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
          {
            zIndex: 1000
          }
        ).addTo(this.map);
      } else {
        if (this.tileLayer != null) {
          this.tileLayer.removeFrom(this.map);
        }

        this.overlayLayer.removeFrom(this.map);
      }

      if (this.tileSource) {
        this.tileLayer = Leaflet.tileLayer(this.tileSource, {
          attribution: this.attribution
        }).addTo(this.map);
      }

      this.overlayLayer = Leaflet.geoJSON(this.item, {
        ...this.geojsonOptions,
        pane: "tilePane"
      }).addTo(this.map);

      if (this.center != null) {
        const [zoom, lat, lng] = this.center;

        this.map.setView([lat, lng], zoom);
      } else {
        this.map.fitBounds(this.overlayLayer.getBounds());
      }
    },
    onFullscreenChange(_fullscreen) {
      // strip fullscreen property
      // eslint-disable-next-line no-unused-vars
      const { fullscreen, ...query } = this.$route.query;

      if (_fullscreen) {
        query.fullscreen = "true";
      }

      this.$router.replace({
        ...this.$route,
        query
      });
    },
    updateHash() {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();

      this.$router.replace({
        ...this.$route,
        hash: `${zoom}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`
      });
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

<style lang="css">
body {
  line-height: 24px;
  color: #111;
  font-family: Arial, sans-serif;
}
blockquote,
body {
  font-size: 16px;
}
table {
  font-size: 80%;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  padding: 0;
  margin: 0;
}
h1,
h2,
h3,
h4 {
  font-family: Arial, sans-serif;
  text-rendering: optimizeLegibility;
  padding-bottom: 4px;
}
h1:last-child,
h2:last-child,
h3:last-child,
h4:last-child {
  padding-bottom: 0;
}
h1 {
  font-weight: 400;
  font-size: 28px;
  line-height: 1.2;
}
h2 {
  font-weight: 700;
  font-size: 21px;
  line-height: 1.3;
}
h3 {
  font-weight: 700;
}
h3,
h4 {
  font-size: 17px;
  line-height: 1.255;
}
h4 {
  font-weight: 400;
}
h5 {
  font-size: 13px;
  line-height: 19px;
}
h5,
h6 {
  font-weight: 700;
}
h6 {
  text-transform: uppercase;
  font-size: 11px;
  line-height: 1.465;
  padding-bottom: 1px;
}
p {
  padding: 0;
  margin: 0 0 14px;
}
p:last-child {
  margin-bottom: 0;
}
p + p {
  margin-top: -4px;
}
b,
strong {
  font-weight: 700;
}
em,
i {
  font-style: italic;
}
blockquote {
  margin: 13px;
}
small {
  font-size: 12px;
}
a,
a:active,
a:link,
a:visited {
  color: #0066c0;
}
header {
  padding: 1.5em 0 0.5em;
}
footer {
  padding-bottom: 3em;
}
code {
  color: #555;
  white-space: nowrap;
}
</style>

<style scoped lang="css">
.leaflet-pseudo-fullscreen {
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 99999;
}

.leaflet-container {
  background-color: #262626;
}

#locator-map {
  height: 200px;
  width: 100%;
  margin-bottom: 10px;
}

#map-container {
  height: 500px;
}

#map {
  height: 100%;
  width: 100%;
}

#thumbnail {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-height: 500px;
}

#header_logo {
  max-width: 100px;
}

.table th,
.table td {
  border: none;
  padding: 0.25rem;
}

.table th {
  border-top: none;
  border-bottom: 1px solid #dee2e6;
}

.metadata td.title {
  font-weight: bold;
  width: 33%;
}

.table-responsive.assets {
  padding: 15px;
}

.table-responsibe.metadata {
  background-color: #f9f9f9;
  border: 1px solid #dee2e6;
  padding: 10px;
}
</style>
