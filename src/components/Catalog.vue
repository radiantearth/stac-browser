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
      <b-col :md="keywords.length > 0 || license != null ? 8 : 12">
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
        <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
        <div v-if="description" v-html="description"></div>
        <template v-if="providers != null && providers.length > 0">
          <h2>Provider<template v-if="providers.length > 1">s</template></h2>
          <dl>
            <template
              v-for="provider in providers"
            >
              <dt :key="provider.url">
                <a
                  :href="provider.url"
                >{{ provider.name }}</a> (<em>{{ (provider.roles || []).join(", ") }}</em>)
              </dt>
              <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
              <dd :key="provider.name" v-html="provider.description"></dd>
            </template>
          </dl>
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
        v-if="keywords.length > 0 || license != null"
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
                <tr v-if="spatialExtent">
                  <!-- TODO display as a locator map -->
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
        <div>
          <b-pagination
            v-model="currentPage"
            :total-rows="itemCount"
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
    catalog() {
      const catalog = this.getEntity(this.url);

      console.log(JSON.stringify(catalog, null, 2));

      return catalog;
    },
    children() {
      return this.catalog.links.filter(x => x.rel === "child").map(child => ({
        path: child.href,
        slug: this.slugify(this.resolve(child.href, this.url)),
        title: child.title || child.href
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
          title: itemLink.title || itemLink.href
        };
      });
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
      return (this.catalog.providers || []).map(x => ({
        ...x,
        description: MARKDOWN_WRITER.render(
          MARKDOWN_READER.parse(x.description || "")
        )
      }));
    },
    rootCatalog() {
      // TODO navigate up parents
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
  methods: {
    ...mapActions(["load"]),
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

ul.links li,
ul.items li {
  margin: 0 0 0.2em;
}
</style>
