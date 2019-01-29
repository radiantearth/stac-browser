import clone from "clone";
import { HtmlRenderer, Parser } from "commonmark";
import escape from "lodash.escape";
import isEqual from "lodash.isequal";
import jsonQuery from "json-query";
import spdxToHTML from "spdx-to-html";
import { mapGetters } from "vuex";

import dictionary from "../lib/stac/dictionary.json";

const MARKDOWN_READER = new Parser({
  smart: true
});
const MARKDOWN_WRITER = new HtmlRenderer({
  safe: true,
  softbreak: "<br />"
});

export default {
  metaInfo() {
    return {
      meta: [
        {
          name: "google-site-verification",
          content: process.env.GOOGLE_SITE_VERIFICATION
        }
      ].filter(({ content }) => content != null),
      script: [
        { innerHTML: JSON.stringify(this.jsonLD), type: "application/ld+json" },
        {
          innerHTML: JSON.stringify({
            path: this.path
          }),
          class: "state",
          type: "application/json"
        }
      ],
      __dangerouslyDisableSanitizers: ["script"],
      title: this.title,
      titleTemplate: "%s ⸬ STAC Browser"
    };
  },
  computed: {
    ...mapGetters(["getEntity"]),
    _collectionProperties() {
      return (this.collection && this.collection.properties) || {};
    },
    _entity() {
      const entity = this.getEntity(this.url);

      if (entity instanceof Error) {
        this.$router.replace("/");
        return;
      }

      return entity;
    },
    _keywords() {
      // [].concat() is a work-around for catalogs where keywords is a string (SpaceNet)
      return [].concat(
        this.entity.keywords ||
          (this.rootCatalog && this.rootCatalog.keywords) ||
          []
      );
    },
    _properties() {
      return this.entity.properties || {};
    },
    _providers() {
      return (
        this.entity.providers ||
        (this.rootCatalog && this.rootCatalog.providers) ||
        []
      );
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
            text: entity.title || entity.id,
            url: uri
          };
        }

        return {
          to,
          url: uri
        };
      });
    },
    description() {
      return (
        this._description &&
        MARKDOWN_WRITER.render(MARKDOWN_READER.parse(this._description))
      );
    },
    entity() {
      return this._entity;
    },
    id() {
      // REQUIRED
      return this.entity.id;
    },
    keywords() {
      return this._keywords.join(", ");
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
    links() {
      if (typeof this.entity.links === "object") {
        // previous STAC version specified links as an object (SpaceNet MVS Dataset)
        return Object.values(this.entity.links);
      }

      return this.entity.links || [];
    },
    loaded() {
      return this.entity != null;
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
            return escape(
              new Date(value).toLocaleString([], {
                timeZone: "UTC",
                timeZoneName: "short"
              }) + suffix
            );
          }

          if (dictionary[key].type === "eo:bands") {
            return escape(
              value
                .map(band => band.description || band.common_name || band.name)
                .join(", ")
            );
          }
        }

        if (key === "eo:epsg") {
          return `<a href="http://epsg.io/${value}">${value}</a>`;
        }

        if (Array.isArray(value)) {
          return escape(value.map(v => JSON.stringify(v)));
        }

        if (typeof value === "object") {
          return escape(JSON.stringify(value));
        }

        return escape(value + suffix);
      };

      const props = {
        ...this._collectionProperties,
        ...this._properties
      };

      return Object.keys(props)
        .filter(k => props[k] != null)
        .map(key => ({
          key,
          label: label(key),
          value: format(key, props[key])
        }));
    },
    providers() {
      return this._providers.map(x => ({
        ...x,
        description: MARKDOWN_WRITER.render(
          MARKDOWN_READER.parse(x.description || "")
        )
      }));
    },
    rootCatalog() {
      const rootLink = this.links.find(x => x.rel === "root");

      if (rootLink != null) {
        return this.getEntity(this.resolve(rootLink.href, this.url));
      }

      return this.getEntity(this.ancestors[0]);
    },
    title() {
      if (this._title != null) {
        return `${this._title} (${this.id})`;
      }

      return this.id;
    }
  },
  watch: {
    entity(to, from) {
      if (!isEqual(to, from)) {
        this._validate(to);

        this.initialize();
      }
    }
  },
  mounted() {
    this.initialize();

    this._validate(this.entity);
  },
  methods: {
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
