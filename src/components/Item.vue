<style lang="css">
body {
  line-height: 24px;
  color: #111;
  font-family: Arial, sans-serif;
}
blockquote, body {
  font-size: 16px;
}
table {
  font-size: 80%;
}
h1, h2, h3, h4, h5, h6 {
  padding: 0;
  margin: 0;
}
h1, h2, h3, h4 {
  font-family: Arial, sans-serif;
  text-rendering: optimizeLegibility;
  padding-bottom: 4px;
}
h1:last-child, h2:last-child, h3:last-child, h4:last-child {
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
h3, h4 {
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
h5, h6 {
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
b, strong {
  font-weight: 700;
}
em, i {
  font-style: italic;
}
blockquote {
  margin: 13px;
}
small {
  font-size: 12px;
}
a, a:active, a:link, a:visited {
  color: #0066c0;
}
header {
  padding: 1.5em 0 0.5em;
}
footer {
  padding-bottom: 3em;
}
code {
  white-space: nowrap;
}
</style>

<style scoped lang="css">
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

#thumbnail {
  height: 500px;
}

#header_logo {
  max-width: 100px;
}

ul.scene_files {
  list-style-type: none;
  padding: 0;
}

ul.scene_files {
  margin: 0 0 1em;
}

ul.scene_files li {
  margin: 0 0 0.2em;
}
</style>

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
          <b-breadcrumb :items="breadcrumbs" />
          <h1>{{ name }}</h1>
          <p>Endpoint: <code>{{ url }}</code></p>
        </header>
      </b-col>
    </b-row>

    <hr>

    <div class="row">
      <div class="col-md-8">
        <div
          id="map-container">
          <!-- TODO locator map -->
          <!-- TODO include location + state in hash -->
          <l-map
            ref="map"
            @update:zoom="onUpdateZoom"
            @update:bounds="onUpdateBounds">
            <l-tile-layer
              :attribution="attribution"
              :url="baseLayerSource"
            />
            <l-geo-json
              v-if="catalog"
              ref="geojsonLayer"
              :geojson="catalog"
              :options="geojsonOptions"
            />
            <l-tile-layer
              v-if="tileSource"
              :url="tileSource"
            />
            <l-tile-layer
              :url="labelLayerSource"
            />
          </l-map>
          <h3>Assets</h3>
          <ul class="scene_files">
            <li
              v-for="asset in assets"
              :key="asset.href">
              <a
                :href="asset.href"
                v-html="asset.name" />
              <template v-if="asset.format"> ({{ asset.format }})</template>
            </li>
          </ul>
        </div>

        <!-- <h3>Preview</h3>
        <a :href="thumbnail">
          <img
            v-if="thumbnail"
            id="thumbnail"
            :src="thumbnail">
        </a> -->
      </div>

      <div class="col-md-4">
        <h3>Metadata</h3>
        <div class="table-responsive">
          <table class="table">
            <tbody>
              <tr
                v-for="prop in propertyList"
                :key="prop.key">
                <td>{{ prop.label }}</td>
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
import escape from "lodash.escape";
import isEqual from "lodash.isequal";
import { LMap, LTileLayer, LGeoJson } from "vue2-leaflet";
import { mapActions, mapGetters } from "vuex";

import dictionary from "../lib/stac/dictionary.json";

export default {
  name: "ItemDetail",
  components: {
    LMap,
    LTileLayer,
    LGeoJson
  },
  props: {
    path: {
      type: Array,
      required: true
    },
    resolve: {
      type: Function,
      required: true
    },
    slugify: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
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
      attribution: `Map data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
      // TODO global config
      baseLayerSource:
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      labelLayerSource:
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png"
    };
  },
  computed: {
    ...mapGetters(["catalogForPath", "urlForPath"]),
    url() {
      return this.urlForPath(this.path);
    },
    breadcrumbs() {
      const rootCatalog = this.catalogForPath([""]);

      return [
        {
          to: "/",
          text: rootCatalog.name
        }
      ].concat(
        this.path
          .map((el, i) => {
            const partialPath = this.path.slice(0, i + 1);
            const catalog = this.catalogForPath(partialPath);
            let slugPath = "/" + partialPath.join("/");

            if (catalog != null) {
              // TODO should there always be an id field?
              // a name field?
              if (catalog.type === "Feature") {
                // TODO how best to distinguish Catalogs from Items?
                slugPath = `/item${slugPath}`;
              }

              return {
                to: slugPath,
                text: catalog.name || catalog.id
              };
            }

            return null;
          })
          .filter(x => x != null)
      );
    },
    catalog() {
      return this.catalogForPath(this.path);
    },
    cog() {
      if (this.assets != null) {
        const cog = this.assets.find(
          // TODO x.name is a Planet-specific workaround
          x => x.format === "cog" || x.name.includes("COG")
        );

        if (cog != null) {
          return new URL(cog.href, this.url).toString();
        }
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
      return this.catalog != null ? this.catalog.links : null;
    },
    assets() {
      if (this.catalog == null) {
        return null;
      }

      // TODO does the key carry semantic meaning?
      // for ISERV, it matches the name (except for `cog`)
      return (
        Object.keys(this.catalog.assets)
          .map(key => ({
            ...this.catalog.assets[key],
            key
          }))
          .map(x => ({
            ...x,
            name: escape(x.name) || `<code>${escape(x.href)}</code>`,
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
    children() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.links.filter(x => x.rel === "child").map(child => ({
        path: child.href,
        url: new URL(child.href, this.self.href).toString()
      }));
    },
    items() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.links.filter(x => x.rel === "item").map(item => {
        const url = new URL(item.href, this.self.href);

        return {
          path: url.pathname,
          url: url.toString()
        };
      });
    },
    propertyList() {
      if (this.catalog == null) {
        return null;
      }

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

          if (dictionary[key].format === "date") {
            return Date.parse(value) + suffix;
          }
        }

        return value + suffix;
      };

      return Object.keys(this.catalog.properties).map(key => ({
        key,
        label: label(key),
        value: format(key, this.catalog.properties[key])
      }));
    },
    properties() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.properties;
    },
    name() {
      return this.catalog != null ? this.catalog.id : null;
    },
    self() {
      if (this.links == null) {
        return null;
      }

      const self = this.links.find(x => x.type === "self");

      return this.resolve(self.href, this.url);
    },
    thumbnail() {
      if (this.links == null) {
        return null;
      }

      const thumbnail = this.links.find(x => x.type === "thumbnail");

      return this.resolve(thumbnail.href, this.url);
    }
  },
  watch: {
    catalog(from, to) {
      if (!isEqual(from, to)) {
        console.log("catalog changed");

        const { map } = this.$refs;
        const {
          mapObject: { attributionControl }
        } = map;

        // TODO license + provider may not be present
        // TODO license may be an object
        attributionControl.addAttribution(
          `Imagery ${this.properties.license} ${this.properties.provider}`
        );

        this.$nextTick(() => {
          const { geojsonLayer } = this.$refs;
          map.setBounds(geojsonLayer.getBounds());
        });
      }
    },
    path(from, to) {
      // created() handles the initial load; this handles components that have been navigated to
      if (!isEqual(from, to)) {
        this.initialize();
      }
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    ...mapActions(["loadPath"]),
    async initialize() {
      await this.loadPath({
        path: this.path
      });

      const { geojsonLayer, map } = this.$refs;
      const {
        mapObject: { attributionControl }
      } = map;

      attributionControl.setPrefix("");

      if (geojsonLayer != null) {
        // TODO license + provider may not be present
        // TODO license may be an object
        attributionControl.addAttribution(
          `Imagery ${this.properties.license} ${this.properties.provider}`
        );

        geojsonLayer.setGeojson(this.catalog);
        map.setBounds(geojsonLayer.getBounds());
      }
    },
    onUpdateBounds() {
      this.updateHash();
    },
    onUpdateZoom() {
      this.updateHash();
    },
    updateHash() {
      const {
        map: { mapObject: map }
      } = this.$refs;
      const center = map.getCenter();
      const zoom = map.getZoom();

      this.$router.replace({
        ...this.$route,
        hash: `${zoom}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`
      });
    }
  }
};
</script>
