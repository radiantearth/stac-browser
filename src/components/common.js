import path from "path";
import url from "url";

import clone from "clone";
import { HtmlRenderer, Parser } from "commonmark";
import escape from "lodash.escape";
import isEqual from "lodash.isequal";
import isEmpty from "lodash.isempty";
import jsonQuery from "json-query";
import spdxToHTML from "spdx-to-html";
import spdxLicenseIds from "spdx-license-ids";
import { mapGetters } from "vuex";

const BAND_LABELS = {
  id: "ID",
  name: "Name",
  common_name: "Common Name",
  gsd: `<abbr title="Ground Sample Distance">GSD</a> (m)`,
  accuracy: "Accuracy (m)",
  center_wavelength: "Center Wavelength (μm)",
  full_width_half_max: `<abbr title="Full width at half maximum">FWHM</abbr> (μm)`,
  description: "Description"
};

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
        { json: this.jsonLD, type: "application/ld+json" },
        {
          json: {
            path: this.path
          },
          class: "state",
          type: "application/json"
        }
      ],
      __dangerouslyDisableSanitizers: ["script"],
      title: this.title,
      titleTemplate: "%s :: STAC Browser"
    };
  },
  computed: {
    ...mapGetters(["getEntity"]),
    _collectionProperties() {
      return (this.collection && this.collection.properties) || {};
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
    assets() {
      if (!this.entity.assets) return [];
      return (
        Object.keys(this.entity.assets)
          .map(key => ({
            ...this.entity.assets[key],
            key
          }))
          .map(x => {
            let bands = x["eo:bands"] || [];
            if (bands.length > 0) {
              // If these are numbers, they are indexes into top
              // level bands (pre-1.0.0). If they are objects, they
              // are band definitions themselves.
              if (Number.isInteger(bands[0])) {
                bands = bands
                  .filter(idx => idx > 0 && idx < this.bands.length)
                  .map(idx => this.bands[idx]);
              }
            }
            return {
              ...x,
              bands: bands,
              title: x.title || path.basename(x.href),
              label:
                escape(x.title) ||
                `<code>${escape(path.basename(x.href))}</code>`,
              href: x.href ? this.resolve(x.href, this.url) : null
            };
          })
          .map(x => {
            return ({
              ...x,
              roleNames: x.roles ? x.roles.filter(x => x != null).join(", ") : null,
              bandNames: (x.bands ? x.bands : [])
                .map(band =>
                  band != null
                    ? band.description || band.common_name || band.name
                    : null
                )
                .filter(x => x != null)
                .join(", ")
            })
          })
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
    bands() {
      return [];  // Overwritten in Item.
    },
    hasBands() {
      return this.bands.length > 0 ||
        this.assets.some(asset => asset.bands.length > 0);
    },
    bandFields() {
      if (!this.bands) return [];

      const example = this.bands[0];

      if (example != null) {
        return Object.keys(example).map(k => ({
          key: k,
          label: BAND_LABELS[k]
        }));
      }

      return [];
    },
    breadcrumbs() {
      // create slugs for everything except the root
      const slugs = this.ancestors.slice(1).map(this.slugify);

      return this.ancestors.map((uri, idx) => {
        let entity = this.getEntity(uri);

        if (entity.type === "FeatureCollection") {
          const { hash } = url.parse(uri);
          const idx = hash.slice(1);

          entity = entity.features[idx];
        }

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
    errored() {
      return (this._entity instanceof Error);
    },
    entity() {
      if (this.errored) {
        return {};
      }
      return this._entity || {};
    },
    id() {
      // REQUIRED
      return this.entity.id;
    },
    keywords() {
      return this._keywords.join(", ");
    },
    license() {
      if (this._license != null && !spdxLicenseIds.includes(this._license)) {
        if (this.licenseUrl != null) {
          return `<a href="${this.licenseUrl}">${this._license}</a>`;
        }

        return this._license;
      }

      return spdxToHTML(this._license) || this._license;
    },
    licenseUrl() {
      if (!spdxLicenseIds.includes(this._license)) {
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
      return Object.keys(this.entity).length > 0;
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
    stacVersion() {
      return this.entity.stac_version;
    },
    title() {
      if (this._title != null) {
        return `${this._title} (${this.id})`;
      }

      return this.id;
    },
    zarrMetadataUrl() {
      const zarrMetadata = this.assets.find(x =>
        x.roles.includes("zarr-consolidated-metadata")
      );

      if (zarrMetadata != null) {
        return zarrMetadata.href;
      }
      return null;
    }
  },
  watch: {
    $route(to, from) {
      if (!isEqual(to.query, from.query)) {
        this.syncWithQueryState(to.query);
      }
    },
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
      this.validate(data).then(errors => {
        if (errors != null) {
          console.group("Validation errors");
          console.log(errors);
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
      });
    },
    async updateState(updated) {
      const qs = {
        ...this.$route.query,
        ...updated
      };

      // remove nulls and false values
      const query = Object.keys(qs)
        .filter(x => qs[x] != null && qs[x] !== false)
        .reduce((acc, k) => {
          acc[k] = qs[k].toString();

          return acc;
        }, {});

      if (isEqual(this.$route.query, query)) {
        // nothing to change
        return;
      }

      try {
        await this.$router.replace({
          ...this.$route,
          query
        });
      } catch (err) {
        console.warn(err);
      }
    }
  }
};
