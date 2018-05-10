<template>
  <div>
    <h2>{{ name }}</h2>

    <l-map
      ref="map"
      style="height: 400px">
      <l-tile-layer
        :attribution="attribution"
        :url="baseLayerSource"
      />
      <l-geo-json
        ref="geojsonLayer"
        :geojson="catalog"
        :options="geojsonOptions"
      />
      <l-tile-layer
        :url="tileSource"
      />
    </l-map>

    <p><code>{{ url }}</code></p>
    <template v-if="properties">
      <p>License: {{ properties.license }}</p>
      <p>Provider: {{ properties.provider }}</p>
      <p>Start: {{ properties.start }}</p>
      <p>End: {{ properties.end }}</p>
    </template>

    <img
      v-if="thumbnail"
      :src="thumbnail"
      width=400>

    <h3>Assets</h3>
    <ul>
      <li
        v-for="asset in assets"
        :key="asset.href">
        <a
          :href="asset.href"
          v-html="asset.name" />
        <template v-if="asset.format"> ({{ asset.format }})</template>
        <template v-if="asset.product"> [<a :href="asset.product">product</a>]</template>
      </li>
    </ul>
  </div>
</template>

<script>
import escape from "lodash.escape";
import { LMap, LTileLayer, LGeoJson } from "vue2-leaflet";

export default {
  name: "ItemDetail",
  components: {
    LMap,
    LTileLayer,
    LGeoJson
  },
  props: {
    url: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      catalog: null,
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
      attribution: `Map data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>`,
      // this is not my Mapbox key
      // TODO global config
      baseLayerSource:
        "https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWJvdWNoYXVkIiwiYSI6ImNpdTA5bWw1azAyZDIyeXBqOWkxOGJ1dnkifQ.qha33VjEDTqcHQbibgHw3w"
    };
  },
  computed: {
    cog() {
      if (this.assets != null) {
        const cog = this.assets.find(x => x.format === "cog");

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
      // return `https://wyn1lx9j71.execute-api.us-east-1.amazonaws.com/production/tiles/{z}/{x}/{y}@2x?url=${encodeURIComponent(
      //   this.cog
      // )}`;
      return `http://localhost:8000/tiles/{z}/{x}/{y}@2x?url=${encodeURIComponent(
        this.cog
      )}`;
    },
    links() {
      return this.catalog != null ? this.catalog.links : null;
    },
    assets() {
      if (this.catalog == null) {
        return null;
      }

      return (
        this.catalog.assets
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

      return new URL(self.href, this.url).toString();
    },
    thumbnail() {
      if (this.links == null) {
        return null;
      }

      const thumbnail = this.links.find(x => x.type === "thumbnail");

      return new URL(thumbnail.href, this.url).toString();
    }
  },
  async created() {
    if (this.url != null) {
      this.catalog = await (await fetch(this.url)).json();

      const { geojsonLayer, map } = this.$refs;
      const {
        mapObject: { attributionControl }
      } = map;

      geojsonLayer.setGeojson(this.catalog);
      attributionControl.setPrefix("");
      map.setBounds(geojsonLayer.getBounds());

      // TODO license + provider may not be present
      attributionControl.addAttribution(
        `Imagery ${this.properties.license} ${this.properties.provider}`
      );
    }
  }
};
</script>

<style lang="css">
</style>
