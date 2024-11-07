<template>
  <section v-if="formattedData.length > 0" class="metadata">
    <component :is="headerTag" v-if="title">{{ titleText }}</component>
    <b-card-group columns :class="`count-${formattedData.length}`">
      <MetadataGroup
        v-for="group in formattedData"
        v-bind="group"
        :key="group.extension"
      />
    </b-card-group>
  </section>
</template>

<script>
import {
  formatAsset,
  formatCatalog,
  formatCollection,
  formatGrouped,
  formatItemProperties,
  formatLink,
  formatProvider,
  formatSummaries,
} from "@radiantearth/stac-fields";
import MetadataGroup from "./metadata/MetadataGroup.vue";
import { isoDuration } from "@musement/iso-duration";
import { mapState } from "vuex";
// Register custom fields for the metadata rendering
// eslint-disable-next-line
import __ from "../../fields.config";

export default {
  name: "Metadata",
  components: {
    MetadataGroup,
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    context: {
      type: Object,
      default: null,
    },
    ignoreFields: {
      type: Array,
      default: () => [],
    },
    title: {
      type: [Boolean, String],
      default: true,
    },
    headerTag: {
      type: String,
      default: "h2",
    },
  },
  data() {
    return {
      formattedData: [],
    };
  },
  computed: {
    ...mapState(["uiLanguage"]),
    titleText() {
      if (typeof this.title === "string") {
        return this.title;
      }
      return this.$t("metadata.title");
    },
  },
  watch: {
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }

        // Update durations (for stac-fields)
        const en = (await import(`../locales/${locale}/duration.js`)).default;
        isoDuration.setLocales({ en });

        // Format the data again to update translations
        this.formattedData = this.formatData();
      },
    },
  },
  methods: {
    formatData() {
      // Filter all fields as given in ignoreFields and also
      // ignore fields starting with an underscore which is likely originating from the STAC class
      let filter = (key) =>
        !key.startsWith("_") && !this.ignoreFields.includes(key);
      switch (this.type) {
        case "Asset":
          return formatAsset(this.data, this.context, filter);
        case "Link":
          return formatLink(this.data, this.context, filter);
        case "Provider":
          return formatProvider(this.data, this.context, filter);
        case "Item":
          return formatItemProperties(this.data, filter);
        case "Catalog":
          return formatCatalog(this.data, filter);
        case "Collection": {
          let core = formatCollection(this.data, filter);
          let summaries = formatSummaries(this.data, filter);
          // Merge summaries into collection metadata
          summaries.forEach((summaryGroup) => {
            let index = core.findIndex(
              (coreGroup) => summaryGroup.extension === coreGroup.extension
            );
            if (index !== -1) {
              Object.assign(core[index].properties, summaryGroup.properties);
            } else {
              core.push(summaryGroup);
            }
          });
          const collator = new Intl.Collator(this.uiLanguage);
          return core.sort((a, b) => collator.compare(a.label, b.label));
        }
        case "FeatureCollection":
          return {};
        default:
          return formatGrouped(this.context, this.data, this.type, filter);
      }
    },
  },
};
</script>

<style lang="scss">
@import "../theme/variables.scss";

#stac-browser {
  .metadata {
    .card {
      border: 0;
      margin-top: $block-margin;
      margin-bottom: $block-margin;
      text-align: left;

      .metadata-rows {
        border-radius: $border-radius;
      }

      .row {
        padding: 0.4rem;
        border-top: 1px solid rgba(0, 0, 0, 0.125);

        &:first-child {
          border-top: 0;
        }
        &:nth-child(odd) {
          background: rgba(0, 0, 0, 0.03);
        }
      }
    }
    .row {
      margin: 0;
      padding: 0;
    }
    .label {
      margin: 0;
      padding-left: 0;
      font-weight: 600;
      vertical-align: top;
    }
    .value {
      margin: 0;
      padding-right: 0;

      > ul,
      > ol,
      > pre,
      > dl,
      > .description {
        max-height: 15em;
        overflow: auto;
      }

      .styled-description {
        h1 {
          font-size: 1.5em;
        }
        h2 {
          font-size: 1.4em;
        }
        h3 {
          font-size: 1.3em;
        }
        h4 {
          font-size: 1.2em;
        }
        h5 {
          font-size: 1.1em;
        }
        h6 {
          font-size: 1em;
        }
      }
    }
    ul {
      padding-left: 1.4em;
      margin-bottom: 0;
    }
    ol {
      padding-left: 2em;
      margin-bottom: 0;
    }
    ul li {
      list-style-type: "- ";
    }
    dl {
      margin: 0;
      margin-left: 1em;
      margin-bottom: 0.5em;

      &:only-child {
        margin-left: 0;
        margin-bottom: 0;
      }
      dl:only-child {
        margin-left: 1em;
      }
    }
    ul > li > dl,
    ol > li > dl {
      margin-left: 0;
    }
    dt {
      display: inline;
    }
    dt:after {
      content: ": ";
    }
    dd {
      display: inline;

      &:not(:last-of-type) > dl:only-child {
        margin-bottom: -1em;
      }
      &:after {
        content: "\A";
        white-space: pre;
        line-height: 1px;
      }
      &:last-of-type:after {
        content: "";
        white-space: normal;
      }
      .description {
        display: inline-block;

        > p:only-child {
          display: inline;
        }
      }
      > ul,
      > ol {
        max-height: 15em;
        overflow: auto;
      }
    }
    .provider .description {
      font-size: 0.9em;
      line-height: 1.5em;
      margin-bottom: 0.5em;
    }
    .checksum-input {
      width: 100%;
    }

    .color {
      text-align: center;

      .color-code {
        color: white;
        text-shadow: 1px 1px 1px #000;
        text-align: center;
      }
    }
  }
}
</style>
