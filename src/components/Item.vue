<template>
  <b-container>
    <b-row>
      <b-col md="12">
        <header>
          <!-- <a href="https://www.planet.com/disasterdata/">
            <img
              id="header_logo"
              src="https://planet-pulse-assets-production.s3.amazonaws.com/uploads/2016/06/blog-logo.jpg"
              alt="Powered by Planet Labs"
              class="float-right">
          </a> -->
          <div><b-breadcrumb :items="breadcrumbs" /></div>
          <h1>{{ title }}</h1>
          <p><small><code>{{ url }}</code></small></p>
        </header>
      </b-col>
    </b-row>

    <hr>

    <div class="row">
      <div class="col-md-8">
        <b-tabs>
          <b-tab
            v-if="cog"
            title="Preview"
            active
          >
            <div
              id="map-container"
            >
              <div id="map"></div>
            </div>
          </b-tab>
          <b-tab
            v-if="thumbnail"
            title="Thumbnail"
          >
            <a :href="thumbnail">
              <img
                id="thumbnail"
                align="center"
                :src="thumbnail"
              >
            </a>
          </b-tab>
        </b-tabs>

        <br>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th colspan="2"><h3>Assets</h3></th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Content-Type</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="asset in assets"
                :key="asset.href"
              >
                <td>
                  <!-- eslint-disable-next-line vue/max-attributes-per-line vue/no-v-html -->
                  <a :href="asset.href" :title="asset.key" v-html="asset.title" />
                </td>
                <td><code>{{ asset.type }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="col-md-4">
        <!-- TODO locator map -->
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th colspan="2"><h3>Metadata</h3></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prop in propertyList"
                :key="prop.key"
              >
                <td class="title">{{ prop.label }}</td>
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

import escape from "lodash.escape";
import Leaflet from "leaflet";
import "leaflet-easybutton";
import { mapGetters } from "vuex";

import dictionary from "../lib/stac/dictionary.json";

export default {
  name: "ItemDetail",
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
    }
  },
  data() {
    return {
      map: null,
      baseLayer: Leaflet.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        {
          attribution: `Map data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>`
        }
      ),
      labelLayer: Leaflet.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png",
        {
          zIndex: 1000
        }
      ),
      previewLayer: null,
      overlayLayer: null,
      geojsonOptions: {
        style: function() {
          return {
            weight: 2,
            color: "#333",
            opacity: 1,
            fillOpacity: 0
          };
        }
      }
    };
  },
  computed: {
    ...mapGetters(["getEntity"]),
    breadcrumbs() {
      // create slugs for everything except the root
      const slugs = this.ancestors.slice(1).map(this.slugify);

      return this.ancestors.map((uri, idx) => {
        const entity = this.getEntity(uri);

        // use all previous slugs to construct a path to this entity
        let to = "/" + slugs.slice(0, idx).join("/");

        if (entity.type === "Feature") {
          // TODO how best to distinguish Catalogs from Items?
          to = "/items" + to;
        }

        return {
          to,
          text: entity.title || entity.id
        };
      });
    },
    item() {
      const entity = this.getEntity(this.url);

      console.log(JSON.stringify(entity, null, 2));

      return entity;
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
    links() {
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
            return new Date(value).toUTCString() + suffix;
          }
        }

        return value + suffix;
      };

      return Object.keys(this.item.properties).map(key => ({
        key,
        label: label(key),
        value: format(key, this.item.properties[key])
      }));
    },
    properties() {
      return this.item.properties || {};
    },
    title() {
      return this.properties.title || this.item.id;
    },
    self() {
      const self = this.links.find(x => x.type === "self");

      return this.resolve(self.href, this.url);
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
        console.log(this.map);
        if (to) {
          this.map.getContainer().classList.add("leaflet-pseudo-fullscreen");
        } else {
          this.map.getContainer().classList.remove("leaflet-pseudo-fullscreen");
        }

        this.map.invalidateSize();
      }
    }
  },
  mounted() {
    this.initialize();
  },
  methods: {
    initialize() {
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

      this.baseLayer.addTo(this.map);
      this.labelLayer.addTo(this.map);

      if (this.tileSource) {
        this.tileLayer = Leaflet.tileLayer(this.tileSource, {
          attribution: this.attribution
        }).addTo(this.map);
      }

      this.overlayLayer = Leaflet.geoJSON(this.item, this.geojsonOptions).addTo(
        this.map
      );

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

.vue2leaflet-map {
  width: 100%;
  height: 100%;
  border: 1px solid #fff;
  background-color: #090909;
  z-index: 1;
  position: relative;
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

td.title {
  font-weight: bold;
}
</style>
