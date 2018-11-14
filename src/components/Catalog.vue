<style scoped lang="css">
h4 {
  font-weight: bold;
}

td.title {
  font-weight: bold;
}

ul.links, ul.items {
  margin: 0 0 1em;
  list-style-type: none;
  padding: 0;
}

ul.links li, ul.items li {
  margin: 0 0 0.2em;
}
</style>

<template>
  <b-container>
    <b-row>
      <b-col md="12">
        <header>
          <b-breadcrumb :items="breadcrumbs" />
        </header>
      </b-col>
    </b-row>
    <b-row>
      <b-col :md="keywords.length > 0 || license != null || propertyList.length > 0 ? 8 : 12">
        <!-- <a href="https://www.planet.com/disasterdata/">
          <img
            id="header_logo"
            src="https://planet-pulse-assets-production.s3.amazonaws.com/uploads/2016/06/blog-logo.jpg"
            alt="Powered by Planet Labs"
            class="float-right">
        </a> -->
        <h1>{{ title }}</h1>
        <p v-if="version"><small>Version {{ version }}</small></p>
        <p><small><code>{{ url }}</code></small></p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <template><p v-html="description" /></template>
        <template v-if="providers != null && providers.length > 0">
          <h2>Provider<template v-if="providers.length > 1">s</template></h2>
          <ul>
            <li
              v-for="provider in providers"
              :key="provider.url"
            >
              <a
                :href="provider.url"
              >{{ provider.name }}</a> (<em>{{ (provider.roles || []).join(", ") }}</em>)
            </li>
          </ul>
        </template>

        <hr>

        <template v-if="children.length > 0">
          <h3>Catalogs</h3>
          <ul class="links">
            <li
              v-for="child in children"
              :key="child.path"
            >
              <router-link
                :to="child.slug"
                append
              >{{ child.title }}</router-link>
            </li>
          </ul>
        </template>
      </b-col>
      <b-col 
        v-if="keywords.length > 0 || license != null || propertyList.length > 0" 
        md="4"
      >
        <b-card
          title="Provider Information"
          bg-variant="light"
          class="float-right"
        >
          <div class="table-responsive">
            <table class="table">
              <tbody>
                <tr v-if="keywords">
                  <td class="title">Keywords</td>
                  <td>{{ keywords }}</td>
                </tr>
                <tr v-if="license">
                  <td class="title">License</td>
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <td v-html="license" />
                </tr>
                <tr v-if="spatialExtent">
                  <!-- TODO display as a locator map -->
                  <td class="title">Spatial Extent</td>
                  <td>{{ spatialExtent }}</td>
                </tr>
                <tr v-if="temporalExtent">
                  <td class="title">Temporal Extent</td>
                  <td>{{ temporalExtent }}</td>
                </tr>
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
        </b-card>
      </b-col>
    </b-row>

    <b-row v-if="items.length > 0">
      <b-col md="12">
        <h3>Items</h3>
        <div>
          <b-pagination
            v-model="currentPage"
            :total-rows="items.length"
            :per-page="perPage"
            :hide-goto-end-buttons="true"
          />
        </div>
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
          <template
            slot="link"
            slot-scope="data"
          >
            <router-link :to="data.item.to">{{ data.item.title }}</router-link>
          </template>
          <!-- TODO row-details w/ additional metadata + map -->
        </b-table>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { HtmlRenderer, Parser } from "commonmark";
import spdxToHTML from "spdx-to-html";
import { mapActions, mapGetters } from "vuex";

import dictionary from "../lib/stac/dictionary.json";

export default {
  name: "Catalog",
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
      perPage: 25
    };
  },
  computed: {
    ...mapGetters(["catalogForPath", "urlForPath"]),
    url() {
      return this.urlForPath(this.path);
    },
    breadcrumbs() {
      if (this.catalog == null) {
        return [];
      }

      const rootCatalog = this.catalogForPath([""]);

      return [
        {
          to: "/",
          text: rootCatalog.title || rootCatalog.id
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
                text: catalog.title || catalog.id
              };
            }

            return null;
          })
          .filter(x => x != null)
      );
    },
    catalog() {
      console.log(JSON.stringify(this.catalogForPath(this.path), null, 2));

      return this.catalogForPath(this.path);
    },
    children() {
      if (this.catalog == null) {
        return [];
      }

      return this.catalog.links
        .filter(x => x.rel === "child")
        .map(child => ({
          path: child.href,
          slug: child.id || this.slugify(this.resolve(child.href, this.url)),
          title: child.title || child.href,
          url: this.resolve(child.href, this.url)
        }));
    },
    description() {
      if (this.catalog == null) {
        return null;
      }

      const reader = new Parser({
        smart: true
      });
      const writer = new HtmlRenderer({
        safe: true,
        softbreak: "<br />"
      });

      return writer.render(reader.parse(this.catalog.description));
    },
    items() {
      if (this.catalog == null) {
        return [];
      }

      // TODO move to async computed and pull from rel=items if necessary

      return this.catalog.links.filter(x => x.rel === "item").map(item => {
        const catalog = this.catalogForPath(
          this.path.concat(item.id || this.slugify(item.href))
        );

        if (catalog != null) {
          return {
            to:
              "/item/" +
              [
                this.$route.params.path,
                item.id || this.slugify(item.href)
              ].join("/"),
            title: catalog.id || item.title || item.href,
            dateAcquired: catalog.properties.datetime
          };
        }

        return {
          to:
            "/item/" +
            [this.$route.params.path, item.id || this.slugify(item.href)].join(
              "/"
            ),
          title: item.title || item.href
        };
      });
    },
    license() {
      if (this.catalog == null) {
        return null;
      }

      // TODO look up license from root if it's not defined here

      return spdxToHTML(this.catalog.license);
    },
    keywords() {
      if (this.catalog == null) {
        return [];
      }

      return [].concat(this.catalog.keywords || []).join(", ");
    },
    // TODO inherit from a common implementation w/ Item
    propertyList() {
      if (this.catalog == null) {
        return [];
      }

      const label = key => {
        if (typeof dictionary[key] === "object") {
          return dictionary[key].label;
        }

        return dictionary[key] || key;
      };

      const format = (key, value) => {
        let suffix = "";

        if (typeof value === "object") {
          value = JSON.stringify(value, null, 2);
        }

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

      return Object.keys(this.properties).map(key => ({
        key,
        label: label(key),
        value: format(key, this.properties[key])
      }));
    },
    properties() {
      if (this.catalog == null) {
        return {};
      }

      return this.catalog.properties || {};
    },
    providers() {
      return this.catalog != null ? this.catalog.providers : null;
    },
    spatialExtent() {
      return this.catalog != null && this.catalog.extent != null
        ? this.catalog.extent.spatial
        : null;
    },
    temporalExtent() {
      if (this.catalog == null || this.catalog.extent == null) {
        return null;
      }

      const {
        extent: { temporal }
      } = this.catalog;

      return [
        temporal[0]
          ? new Date(temporal[0]).toLocaleString()
          : "beginning of time",
        temporal[1] ? new Date(temporal[1]).toLocaleString() : "now"
      ].join(" - ");
    },
    title() {
      return this.catalog != null
        ? this.catalog.title || this.catalog.id
        : null;
    },
    version() {
      return this.catalog != null ? this.catalog.version : null;
    }
  },
  watch: {
    currentPage(to) {
      const start = (to - 1) * this.perPage;
      const count = to * this.perPage;

      return this.catalog.links
        .filter(x => x.rel === "item")
        .slice(start, count)
        .map(item =>
          this.loadPath({
            path: this.path.concat(item.id || this.slugify(item.href))
          })
        );
    },
    path() {
      // created() handles the initial load; this handles components that have been navigated to
      this.initialize();
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

      const catalog = this.catalogForPath(this.path);

      if (catalog != null) {
        const start = (this.currentPage - 1) * this.perPage;
        const count = this.currentPage * this.perPage;

        await Promise.all(
          catalog.links
            .filter(x => x.rel === "item")
            .slice(start, count)
            .map(item =>
              this.loadPath({
                path: this.path.concat(item.id || this.slugify(item.href))
              })
            )
        );
      }
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
