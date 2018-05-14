<style scoped lang="css">
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
          <template v-if="meta">
            <p>
              Contact: {{ meta.contact }}<br>
              Keywords: {{ meta.keywords }}<br>
              Formats: {{ meta.formats }}<br>
              License: <span v-html="license" />
            </p>
          </template>
        </header>
      </b-col>
    </b-row>

    <hr>

    <b-row v-if="children.length > 0">
      <b-col md="12">
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
      </b-col>
    </b-row>

    <b-row v-if="items.length > 0">
      <b-col md="12">
        <h3>Items</h3>
        <ul class="items">
          <li
            v-for="item in items"
            :key="item.path">
            <router-link :to="'/item/' + item.slug">{{ item.title }}</router-link>
          </li>
        </ul>
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
    items() {
      if (this.catalog == null) {
        return [];
      }

      return this.catalog.links.filter(x => x.rel === "item").map(item => ({
        slug: [this.$route.params.path, this.slugify(item.href)].join("/"),
        title: item.title || item.href,
        url: this.resolve(item.href, this.url)
      }));
    },
    license() {
      if (this.catalog == null) {
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
    // TODO it doesn't appear to make any sense to group these here
    meta() {
      if (this.catalog == null) {
        return null;
      }

      const {
        name,
        provider,
        contact,
        keywords,
        formats,
        license
      } = this.catalog;

      if (
        provider == null &&
        contact == null &&
        keywords == null &&
        formats == null &&
        license == null
      ) {
        return null;
      }

      return {
        name,
        provider,
        // TODO safely construct this
        contact: `${contact.name} <${contact.email}>`,
        keywords: keywords.join(", "),
        formats: formats.join(", "),
        license
      };
    },
    name() {
      return this.catalog != null ? this.catalog.name : null;
    },
    self() {
      if (this.catalog == null) {
        return null;
      }

      return this.catalog.links.find(x => x.rel === "self");
    }
  },
  watch: {
    path() {
      // created() handles the initial load; this handles components that have been navigated to
      this.loadPath({
        path: this.path
      });
    }
  },
  created() {
    this.loadPath({
      path: this.path
    });
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
    ...mapActions(["loadPath"])
  }
};
</script>
