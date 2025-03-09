<template>
  <b-card no-body :class="classes" v-b-visible.400="load" :img-right="isList">
    <div class="test" v-if="hasImage">
      <b-card-img-lazy class="thumbnail" offset="200" v-bind="thumbnail" />
    </div>
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, catalog]" class="stretched-link" />
      </b-card-title>
      <b-card-text
        v-if="
          data &&
          (fileFormats.length > 0 || data.description || data.deprecated)
        "
        class="intro"
      >
        <b-badge
          v-if="data.deprecated"
          variant="warning"
          class="mr-1 mt-1 deprecated"
        >
          {{ $t("deprecated") }}</b-badge
        >
        <b-badge
          v-for="format in fileFormats"
          :key="format"
          variant="secondary"
          class="mr-1 mt-1 fileformat"
        >
          {{ format | formatMediaType }}</b-badge
        >
        {{ data.description | summarize }}
      </b-card-text>
      <Keywords
        v-if="showKeywordsInCatalogCards && keywords.length > 0"
        :keywords="keywords"
        variant="primary"
        :center="!isList"
      />
      <b-card-text v-if="temporalExtent" class="datetime"
        ><small v-html="temporalExtent"
      /></b-card-text>
    </b-card-body>
    <b-card-footer>
      <slot name="footer" :data="data" />
    </b-card-footer>
  </b-card>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import StacFieldsMixin from "./StacFieldsMixin";
import ThumbnailCardMixin from "./ThumbnailCardMixin";
import StacLink from "./StacLink.vue";
import STAC from "../models/stac";
import {
  formatMediaType,
  formatTemporalExtent,
} from "@radiantearth/stac-fields/formatters";
import Utils from "../utils";

export default {
  name: "Catalog",
  components: {
    StacLink,
    Keywords: () => import("./Keywords.vue"),
  },
  filters: {
    summarize: (text) => Utils.summarizeMd(text, 300),
    formatMediaType: (value) => formatMediaType(value, null, { shorten: true }),
  },
  mixins: [ThumbnailCardMixin, StacFieldsMixin({ formatTemporalExtent })],
  props: {
    catalog: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapState(["showKeywordsInCatalogCards"]),
    ...mapGetters(["getStac"]),
    classes() {
      let classes = ["catalog-card"];
      if (!this.data) {
        classes.push("queued");
      }
      if (this.data && this.data.deprecated) {
        classes.push("deprecated");
      }
      if (this.hasImage) {
        classes.push("has-thumbnail");
      }
      if (this.temporalExtent) {
        classes.push("has-extent");
      }
      return classes;
    },
    data() {
      return this.getStac(this.catalog);
    },
    temporalExtent() {
      if (
        this.data?.isCollection() &&
        this.data.extent?.temporal?.interval.length > 0
      ) {
        let extent = this.data.extent.temporal.interval[0];
        if (
          Array.isArray(extent) &&
          (typeof extent[0] === "string" || typeof extent[1] === "string")
        ) {
          return this.formatTemporalExtent(
            this.data.extent.temporal.interval[0],
            true
          );
        }
      }
      return null;
    },
    fileFormats() {
      if (this.data) {
        return this.data.getFileFormats();
      }
      return [];
    },
    keywords() {
      if (this.data) {
        return this.data.getMetadata("keywords") || [];
      }
      return [];
    },
  },
  methods: {
    load(visible) {
      if (this.catalog instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? "queue" : "unqueue", this.catalog.href);
    },
  },
};
</script>

<style lang="scss">
@import "~bootstrap/scss/mixins";
@import "../theme/variables.scss";

#stac-browser {
  .catalog-card {
    &.deprecated {
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }

    .card-body,
    .card-footer {
      // position: relative;
    }
    .card-footer:empty {
      display: none;
    }
    .card-title {
      margin-bottom: 0.5rem;
      -webkit-line-clamp: 2;
    }
    .intro {
      -webkit-line-clamp: 3;
    }
    .intro,
    .card-title {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
      text-align: left;
      background-color: greenyellow;
    }

    &.has-extent {
      .intro {
        margin-bottom: 0.5rem;
      }
    }
        .datetime {
      color: map-get($theme-colors, "secondary");
    }
    .badge.deprecated {
      text-transform: uppercase;
    }
  }
  .card-list {
    .catalog-card {
      box-sizing: border-box;
      margin: 0.5em 0;
      display: flex;

      .card-img-right {
        min-height: 100px;
        height: 100%;
        max-height: 8.5rem;
        max-width: 33%;
        object-fit: contain;
        object-position: right;
      }
      .card-footer {
        min-width: 175px;
        max-width: 175px;
        border-top: 0;
      }
      .intro {
        -webkit-line-clamp: 2;
      }
    }
  }
  .card-columns {
    .catalog-card {
      box-sizing: border-box;
      margin-top: 0.5em 0;
      text-align: center;

      // &.queued {
      //   min-height: 10rem;
      // }
      .test {
        background-color: rgb(204, 204, 204);
        width: 100%;
        height: 220px;
      }
      .card-img {
        width: 100%;
        height: 100%;
        background-color: rgb(0, 255, 21);
      }

      .card-body {
        // position: relative;
        background-color: rgb(241, 180, 180);
        height: 180px;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        text-align: start;
        padding: 8px
      }
    }
  }
}
</style>
