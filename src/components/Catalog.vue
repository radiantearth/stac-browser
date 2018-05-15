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
      <b-col :md="meta ? 7 : 12">
        <!-- <a href="https://www.planet.com/disasterdata/">
          <img
            id="header_logo"
            src="https://planet-pulse-assets-production.s3.amazonaws.com/uploads/2016/06/blog-logo.jpg"
            alt="Powered by Planet Labs"
            class="float-right">
        </a> -->
        <h1><a :href="homepage">{{ name }}</a></h1>
        <p><small><code>{{ url }}</code></small></p>
        <p><em>{{ description }}</em></p>
        <p v-html="license" />

        <hr>

        <template v-if="children.length > 0">
          <h3>Catalogs</h3>
          <ul class="links">
            <li
              v-for="child in children"
              :key="child.path">
              <router-link
                :to="child.slug"
                append>{{ child.title }}</router-link>
            </li>
          </ul>
        </template>
      </b-col>
      <b-col
        v-if="meta"
        md="5">
        <b-card
          title="Provider Information"
          bg-variant="light"
          class="float-right">
          <div class="table-responsive">
            <table class="table">
              <tbody>
                <tr v-if="meta.contact">
                  <td class="title">Contact</td>
                  <td>
                    {{ meta.contact.name }}<br>
                    {{ meta.contact.organization }}<br>
                    <a :href="meta.contact.emailUrl">{{ meta.contact.email }}</a><br>
                    <a :href="meta.contact.url">{{ meta.contact.url }}</a>
                  </td>
                </tr>
                <tr v-if="meta.keywords">
                  <td class="title">Keywords</td>
                  <td>{{ meta.keywords }}</td>
                </tr>
                <tr v-if="meta.formats">
                  <td class="title">Formats</td>
                  <td>{{ meta.formats }}</td>
                </tr>
                <tr v-if="meta.shortLicense">
                  <td class="title">License</td>
                  <td><a :href="meta.licenseUrl">{{ meta.shortLicense }}</a></td>
                </tr>
                <tr v-if="meta.provider.scheme">
                  <td class="title">Storage Provider</td>
                  <td>{{ meta.provider.scheme }}</td>
                </tr>
                <tr v-if="meta.provider.region">
                  <td class="title">Storage Region</td>
                  <td>{{ meta.provider.region }}</td>
                </tr>
                <tr v-if="meta.provider.requesterPays">
                  <td class="title">Requester Pays</td>
                  <td>{{ meta.provider.requesterPays }}</td>
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
          :total-rows="items.length"
          :per-page="perPage"
          :hide-goto-end-buttons="true"
          v-model="currentPage" />
        <b-table
          :items="items"
          :fields="itemFields"
          :per-page="perPage"
          :current-page="currentPage"
          :sort-compare="sortCompare"
          :outlined="true"
          responsive
          small
          striped>
          <template
            slot="link"
            slot-scope="data">
            <router-link :to="data.item.to">{{ data.item.title }}</router-link>
          </template>
          <!-- TODO row-details w/ additional metadata + map -->
        </b-table>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import escape from "lodash.escape";
import { mapActions, mapGetters } from "vuex";

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
          sortable: true
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
      console.log(JSON.stringify(this.catalogForPath(this.path), null, 2));
      return this.catalogForPath(this.path);
    },
    children() {
      if (this.catalog == null) {
        return [];
      }

      return this.catalog.links.filter(x => x.rel === "child").map(child => ({
        path: child.href,
        slug: this.slugify(child.href),
        title: child.title || child.href,
        url: this.resolve(child.href, this.url)
      }));
    },
    description() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.description;
    },
    items() {
      if (this.catalog == null) {
        return [];
      }

      return this.catalog.links.filter(x => x.rel === "item").map(item => {
        const catalog = this.catalogForPath(
          this.path.concat(this.slugify(item.href))
        );

        if (catalog != null) {
          return {
            to:
              "/item/" +
              [this.$route.params.path, this.slugify(item.href)].join("/"),
            title: catalog.id || item.title || item.href,
            dateAcquired: catalog.properties.datetime
          };
        }

        return {
          to:
            "/item/" +
            [this.$route.params.path, this.slugify(item.href)].join("/"),
          title: item.title || item.href
        };
      });
    },
    homepage() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.homepage;
    },
    license() {
      if (this.catalog == null || this.catalog.license == null) {
        return null;
      }

      // TODO short_name in JSON -> not snake case
      const {
        copyright,
        link,
        name,
        short_name: shortName
      } = this.catalog.license;

      if (
        copyright != null &&
        link != null &&
        name != null &&
        shortName != null
      ) {
        console.log(this.catalog.license);
        return `Licensed under <a href="${link}" title=${escape(
          shortName
        )}>${name}</a> by ${escape(copyright)}`;
      }

      return this.catalog.license;
    },
    meta() {
      if (this.catalog == null) {
        return null;
      }

      const { provider, contact, keywords, formats, license } = this.catalog;

      if (
        provider == null &&
        contact == null &&
        keywords == null &&
        formats == null &&
        license == null
      ) {
        return null;
      }

      const meta = {
        contact,
        provider,
        license,
        keywords: (keywords || []).join(", "),
        formats: (formats || []).join(", ")
      };

      if (contact != null && contact.email != null) {
        meta.contact = {
          ...meta.contact,
          emailUrl: `mailto:${contact.email}`
        };
      }

      if (license != null) {
        if (license.short_name != null) {
          // TODO short_name in JSON -> not snake case
          meta.shortLicense = license.short_name;
        }

        if (license.link != null) {
          meta.licenseUrl = license.link;
        }
      }

      return meta;
    },
    name() {
      return this.catalog != null ? this.catalog.name : null;
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
            path: this.path.concat(this.slugify(item.href))
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
  mounted() {
    // console.log("mounted");
  },
  beforeUpdate() {
    // console.log("before update");
  },
  updated() {
    // console.log("updated");
  },
  beforeRouteEnter(to, from, next) {
    // console.log("beforeRouteEnter", to, from);

    // console.log("$route:", this.$route);
    // console.log(this);

    return next();
  },
  beforeRouteUpdate(to, from, next) {
    // console.log("beforeRouteUpdate", to, from);

    return next();
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

        return catalog.links
          .filter(x => x.rel === "item")
          .slice(start, count)
          .map(item =>
            this.loadPath({
              path: this.path.concat(this.slugify(item.href))
            })
          );
      }
    },
    sortCompare(a, b, key) {
      if (key === "link") {
        key = "title";
      }

      if (typeof a[key] === "number" && typeof b[key] === "number") {
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
