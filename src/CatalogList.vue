<template>
  <div>
    <h2>{{ name }}</h2>
    <template v-if="meta">
      <p>Contact: {{ meta.contact }}</p>
      <p>Keywords: {{ meta.keywords }}</p>
      <p>Formats: {{ meta.formats }}</p>
      <p>License: {{ meta.license }}</p>
    </template>

    <p><code>{{ url }}</code></p>
    <ul>
      <li
        v-for="child in children"
        :key="child.path">
        <router-link :to="child.path">{{ child.path }}</router-link>
      </li>
    </ul>
    <ul>
      <li
        v-for="item in items"
        :key="item.path">
        <router-link :to="'/item' + item.path">{{ item.path }}</router-link>
      </li>
    </ul>
    <!-- <pre>{{ catalog }}</pre> -->
  </div>
</template>

<script>
export default {
  name: "CatalogList",
  props: {
    url: {
      type: String,
      required: true
    }
  },
  asyncComputed: {
    async catalog() {
      if (this.url != null) {
        console.log(`Fetching catalog: ${this.url}`);
        return (await fetch(this.url)).json();
      }
    }
  },
  computed: {
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
  }
};
</script>

<style lang="css">
</style>
